import { assertKoaCondition } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  EmailAuthorization,
  getDB,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
} from '../../../../../../../models/index.js';
import { checkOrganizationOwnerRemoval } from '../../../../../../../utils/authorization.js';
import {
  lockOrganizationSsoIdentity,
  resolveOrganizationSsoRoles,
} from '../../../../../../../utils/organizationSso.js';

export async function deleteCurrentUserOidcIdentity(ctx: Context): Promise<void> {
  ctx.set('Cache-Control', 'private, no-store');
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && ctx.state.authTime >= Date.now() / 1000 - 600,
    ctx,
    403,
    'Sign in again before unlinking organization single sign-on.',
  );
  const userId = ctx.user!.id;
  const identity = await OrganizationSsoIdentity.findOne({
    where: { id: ctx.pathParams.identityId, UserId: userId },
  });
  assertKoaCondition(identity != null, ctx, 404, 'Organization SSO identity not found.');

  ctx.body = await getDB().transaction(async (transaction) => {
    await lockOrganizationSsoIdentity(identity, transaction);
    const selected = await OrganizationSsoIdentity.findOne({
      where: { id: identity.id, UserId: userId },
      transaction,
    });
    assertKoaCondition(selected != null, ctx, 404, 'Organization SSO identity not found.');
    assertKoaCondition(
      (await EmailAuthorization.count({ where: { UserId: userId, verified: true }, transaction })) >
        0 || (await OAuthAuthorization.count({ where: { UserId: userId }, transaction })) > 0,
      ctx,
      409,
      'Keep a verified email address or a personal social login before unlinking organization SSO.',
    );
    const members = await OrganizationMember.findAll({
      where: { UserId: userId },
      transaction,
    });
    const configurations = await OrganizationSso.findAll({
      where: {
        issuer: identity.issuer,
        OrganizationId: { [Op.in]: members.map((m) => m.OrganizationId) },
      },
      order: [['OrganizationId', 'ASC']],
      transaction,
    });
    for (const sso of configurations) {
      await Organization.findByPk(sso.OrganizationId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }
    const sessions = await OrganizationSsoSession.findAll({
      attributes: ['id'],
      where: { OrganizationSsoIdentityId: identity.id },
      transaction,
    });
    for (const configuration of configurations) {
      const sso = await OrganizationSso.findByPk(configuration.OrganizationId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      const member = await OrganizationMember.findOne({
        where: {
          OrganizationId: configuration.OrganizationId,
          UserId: userId,
        },
        transaction,
      });
      if (!sso || sso.issuer !== identity.issuer || !member) {
        continue;
      }
      const remaining = await OrganizationSsoSession.findAll({
        where: {
          OrganizationId: sso.OrganizationId,
          configurationUpdated: sso.configurationUpdated,
          [Op.or]: [
            { accessTokenExpires: { [Op.gt]: new Date() } },
            { refreshToken: { [Op.ne]: null } },
          ],
        },
        include: [
          { model: OrganizationSsoIdentity, where: { UserId: userId, issuer: sso.issuer } },
        ],
        transaction,
      });
      const credentials = await OAuth2ClientCredentials.findAll({
        attributes: ['OrganizationSsoSessionId'],
        where: {
          OrganizationSsoSessionId: { [Op.in]: remaining.map(({ id }) => id) },
          expires: { [Op.or]: [null, { [Op.gt]: new Date() }] },
        },
        transaction,
      });
      const credentialSessions = new Set(credentials.map((c) => c.OrganizationSsoSessionId));
      const usable = remaining.filter(
        (session) =>
          (!session.interactiveRevoked && session.expires.getTime() > Date.now()) ||
          credentialSessions.has(session.id),
      );
      if (member.role != null || member.guest) {
        const ownerUsesProvider = member.guest
          ? sso.policy !== 'required' && sso.allowedLoginMethods.includes('oidc')
          : sso.policy === 'optional';
        const providerAccess = usable.filter(
          (session) =>
            member.guest ||
            resolveOrganizationSsoRoles(session.groups, sso.roleMappings).length > 0,
        );
        if (
          member.role === PredefinedOrganizationRole.Owner &&
          ownerUsesProvider &&
          !sso.allowedLoginMethods.some((method) => method !== 'oidc') &&
          providerAccess.length > 0 &&
          !providerAccess.some((session) => session.OrganizationSsoIdentityId !== identity.id)
        ) {
          await checkOrganizationOwnerRemoval(ctx, member, null, transaction);
        }
        continue;
      }
      const beforeRoles = resolveOrganizationSsoRoles(
        usable.flatMap(({ groups }) => groups),
        sso.roleMappings,
      );
      const afterRoles = resolveOrganizationSsoRoles(
        usable.flatMap((session) =>
          session.OrganizationSsoIdentityId === identity.id ? [] : session.groups,
        ),
        sso.roleMappings,
      );
      await checkOrganizationOwnerRemoval(
        ctx,
        {
          OrganizationId: member.OrganizationId,
          UserId: member.UserId,
          role: member.role,
          guest: member.guest,
          ssoRoles: beforeRoles,
        },
        { role: member.role, guest: member.guest, ssoRoles: afterRoles },
        transaction,
      );
      if (JSON.stringify(member.ssoRoles) !== JSON.stringify(afterRoles)) {
        await member.update({ ssoRoles: afterRoles }, { transaction });
      }
    }
    await OAuth2ClientCredentials.destroy({
      where: { OrganizationSsoSessionId: { [Op.in]: sessions.map(({ id }) => id) } },
      transaction,
    });
    await selected.destroy({ transaction });
    return { sessionRevoked: sessions.some(({ id }) => id === ctx.state.organizationSsoSessionId) };
  });
}
