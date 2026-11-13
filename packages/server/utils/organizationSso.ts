import {
  organizationLoginMethods,
  type OrganizationSsoConfiguration,
  type OrganizationSsoRoleMapping,
  type OrganizationSsoSettings,
  type PredefinedOrganizationRole,
} from '@appsemble/types';
import { schemas } from '@appsemble/utils';
import { type Schema, Validator } from 'jsonschema';
import { type Context } from 'koa';
import { type Transaction } from 'sequelize';

import { argv } from './argv.js';
import { decrypt, encrypt } from './crypto.js';
import { validateOrganizationSsoSession } from './organizationSsoSession.js';
import {
  getDB,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
} from '../models/index.js';

export function getOrganizationSsoSettings(sso: OrganizationSso): OrganizationSsoSettings {
  return {
    issuer: sso.issuer,
    clientId: sso.clientId,
    name: sso.name,
    scope: sso.scope,
    groupClaim: sso.groupClaim,
    roleMappings: sso.roleMappings,
    policy: sso.policy,
    allowedLoginMethods: sso.allowedLoginMethods,
    managedBy: sso.managedBy,
    hasClientSecret: Boolean(sso.clientSecret),
  };
}

export function validateOrganizationSsoConfiguration(
  configuration: OrganizationSsoConfiguration,
): OrganizationSsoConfiguration {
  const normalized = {
    ...configuration,
    scope: configuration.scope ?? 'openid email profile',
    groupClaim: configuration.groupClaim ?? 'groups',
    roleMappings: configuration.roleMappings ?? [],
    allowedLoginMethods: configuration.allowedLoginMethods ?? [...organizationLoginMethods],
  };
  const validation = new Validator().validate(
    normalized,
    schemas.OrganizationSsoConfiguration as Schema,
  );
  if (!validation.valid) {
    throw new Error(validation.errors.map(({ stack }) => stack).join('; '));
  }
  const issuer = new URL(normalized.issuer);
  if (
    issuer.username ||
    issuer.password ||
    issuer.search ||
    issuer.hash ||
    (issuer.protocol !== 'https:' &&
      !(
        process.env.NODE_ENV !== 'production' &&
        issuer.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(issuer.hostname)
      ))
  ) {
    throw new Error('The issuer must be an HTTPS URL without credentials, a query, or a fragment.');
  }
  if (!normalized.scope.split(/\s+/).includes('openid')) {
    throw new Error('The single sign-on scope must include openid.');
  }
  return normalized;
}

export function hasOrganizationSsoProviderChanged(
  current: OrganizationSso | null,
  configuration: OrganizationSsoConfiguration,
): boolean {
  return (
    !current ||
    (configuration.clientSecret !== undefined &&
      decrypt(current.clientSecret, argv.aesSecret) !== configuration.clientSecret) ||
    (['issuer', 'clientId', 'scope', 'groupClaim'] as const).some(
      (field) => current[field] !== configuration[field],
    )
  );
}

export function resolveOrganizationSsoRoles(
  groups: readonly string[],
  roleMappings: OrganizationSsoRoleMapping[],
): PredefinedOrganizationRole[] {
  const groupSet = new Set(groups);
  return [
    ...new Set(roleMappings.filter(({ group }) => groupSet.has(group)).map(({ role }) => role)),
  ];
}

export async function applyOrganizationSsoConfiguration(
  organizationId: string,
  configuration: OrganizationSsoConfiguration,
  managedBy: OrganizationSsoSettings['managedBy'],
  transaction?: Transaction,
): Promise<OrganizationSso> {
  const normalized = validateOrganizationSsoConfiguration(configuration);
  if (!(await Organization.findByPk(organizationId, { transaction }))) {
    throw new Error('Organization not found.');
  }
  const current = await OrganizationSso.findByPk(organizationId, { transaction });
  if (
    !normalized.clientSecret &&
    (!current || current.issuer !== normalized.issuer || current.clientId !== normalized.clientId)
  ) {
    throw new Error('A client secret is required for this provider.');
  }
  const secretChanged =
    normalized.clientSecret !== undefined &&
    (!current || decrypt(current.clientSecret, argv.aesSecret) !== normalized.clientSecret);
  const values = {
    ...normalized,
    OrganizationId: organizationId,
    managedBy,
    clientSecret: secretChanged
      ? encrypt(normalized.clientSecret!, argv.aesSecret)
      : current!.clientSecret,
  };
  const providerChanged = hasOrganizationSsoProviderChanged(current, normalized);
  const mappingsChanged =
    current && JSON.stringify(current.roleMappings) !== JSON.stringify(normalized.roleMappings);
  const save = async (saveTransaction: Transaction): Promise<OrganizationSso> => {
    const configurationUpdated = providerChanged
      ? new Date(Math.max(Date.now(), (current?.configurationUpdated.getTime() ?? 0) + 1))
      : current!.configurationUpdated;
    const sso = current
      ? await current.update({ ...values, configurationUpdated }, { transaction: saveTransaction })
      : await OrganizationSso.create(
          { ...values, configurationUpdated },
          { transaction: saveTransaction },
        );
    if (providerChanged) {
      await OrganizationSsoSession.destroy({
        where: { OrganizationId: organizationId },
        transaction: saveTransaction,
      });
      await OrganizationMember.update(
        { ssoRoles: [] },
        { where: { OrganizationId: organizationId }, transaction: saveTransaction },
      );
    } else if (mappingsChanged) {
      const sessions = await OrganizationSsoSession.findAll({
        where: { OrganizationId: organizationId, configurationUpdated },
        include: [OrganizationSsoIdentity],
        order: [['updated', 'DESC']],
        transaction: saveTransaction,
      });
      const latestGroups = new Map<string, string[]>();
      for (const session of sessions) {
        const userId = session.OrganizationSsoIdentity!.UserId;
        if (!latestGroups.has(userId)) {
          latestGroups.set(userId, session.groups);
        }
      }
      const members = await OrganizationMember.findAll({
        where: { OrganizationId: organizationId, role: null, guest: false },
        transaction: saveTransaction,
      });
      for (const member of members) {
        await member.update(
          {
            ssoRoles: resolveOrganizationSsoRoles(
              latestGroups.get(member.UserId) ?? [],
              normalized.roleMappings,
            ),
          },
          { transaction: saveTransaction },
        );
      }
    }
    return sso;
  };
  return transaction ? save(transaction) : getDB().transaction(save);
}

export async function synchronizeOrganizationSsoMembership({
  groups,
  organizationId,
  transaction,
  userId,
}: {
  organizationId: string;
  userId: string;
  groups: readonly string[];
  transaction?: Transaction;
}): Promise<OrganizationMember | null> {
  const sso = await OrganizationSso.findByPk(organizationId, { transaction });
  if (!sso) {
    return null;
  }
  const roles = resolveOrganizationSsoRoles(groups, sso.roleMappings);
  const member = await OrganizationMember.findOne({
    where: { OrganizationId: organizationId, UserId: userId },
    transaction,
  });
  if (member?.guest) {
    return sso.policy !== 'required' && sso.allowedLoginMethods.includes('oidc') ? member : null;
  }
  if (!roles.length) {
    if (member) {
      await member.update({ ssoRoles: [] }, { transaction });
    }
    return null;
  }
  if (!member) {
    return OrganizationMember.create(
      { OrganizationId: organizationId, UserId: userId, role: null, ssoRoles: roles },
      { transaction },
    );
  }
  if (member.role != null || JSON.stringify(member.ssoRoles) !== JSON.stringify(roles)) {
    await member.update({ role: null, ssoRoles: roles }, { transaction });
  }
  return member;
}

export async function getOrganizationMemberAccess(
  ctx: Context,
  organizationId: string,
): Promise<OrganizationMember | null> {
  if (!ctx.user) {
    return null;
  }
  const member = await OrganizationMember.findOne({
    where: { OrganizationId: organizationId, UserId: ctx.user.id },
  });
  if (!member) {
    return null;
  }
  const sso = await OrganizationSso.findByPk(organizationId);
  if (!sso) {
    return member.role ? member : null;
  }
  if (member.guest) {
    return sso.policy !== 'required' &&
      member.role &&
      sso.allowedLoginMethods.includes(ctx.state.loginMethod)
      ? member
      : null;
  }
  const session = await validateOrganizationSsoSession(ctx, sso);
  if (session) {
    return synchronizeOrganizationSsoMembership({
      organizationId,
      userId: ctx.user.id,
      groups: session.groups,
    });
  }
  return sso.policy === 'optional' &&
    member.role &&
    sso.allowedLoginMethods.includes(ctx.state.loginMethod)
    ? member
    : null;
}

export function getOrganizationMemberRoles(
  member: OrganizationMember,
): PredefinedOrganizationRole[] {
  return member.guest || member.role ? (member.role ? [member.role] : []) : member.ssoRoles;
}
