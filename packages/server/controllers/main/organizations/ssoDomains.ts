import { createHmac } from 'node:crypto';
import dns from 'node:dns/promises';

import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import {
  ORGANIZATION_SSO_RECENT_SIGN_IN_REQUIRED,
  OrganizationPermission,
  type OrganizationSsoDomains,
} from '@appsemble/types';
import { type Context } from 'koa';
import { type Transaction } from 'sequelize';

import {
  getDB,
  Organization,
  OrganizationSso,
  OrganizationSsoDomain,
} from '../../../models/index.js';
import { argv } from '../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { normalizeOrganizationSsoDomain } from '../../../utils/organizationSsoDomain.js';

async function checkDomainPermissions(ctx: Context): Promise<void> {
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: ctx.pathParams.organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
}

async function assertMutableDomains(ctx: Context, transaction: Transaction): Promise<void> {
  await checkDomainPermissions(ctx);
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && Date.now() / 1000 - ctx.state.authTime < 600,
    ctx,
    403,
    'Sign in again before changing single sign-on domains.',
    { code: ORGANIZATION_SSO_RECENT_SIGN_IN_REQUIRED },
  );
  const { organizationId } = ctx.pathParams;
  await Organization.findByPk(organizationId, { transaction, lock: transaction.LOCK.UPDATE });
  const sso = await OrganizationSso.findByPk(organizationId, { transaction });
  assertKoaCondition(sso != null, ctx, 404, 'Organization SSO is not configured.');
  assertKoaCondition(
    sso.managedBy !== 'deployment',
    ctx,
    409,
    'These single sign-on domains are managed by the deployment.',
  );
}

function normalizeDomain(ctx: Context, value: string): string {
  try {
    return normalizeOrganizationSsoDomain(value);
  } catch (error) {
    throwKoaError(ctx, 400, (error as Error).message);
  }
}

async function getDomains(organizationId: string): Promise<OrganizationSsoDomains> {
  const claims = await OrganizationSsoDomain.findAll({
    where: { OrganizationId: organizationId },
    order: [['domain', 'ASC']],
  });
  return {
    recordValue: `appsemble-sso=${createHmac('sha256', argv.secret)
      .update(`organization-sso-domain:${organizationId}`)
      .digest('hex')}`,
    domains: claims.map(({ domain }) => domain),
  };
}

export async function getOrganizationSsoDomains(ctx: Context): Promise<void> {
  await checkDomainPermissions(ctx);
  ctx.body = await getDomains(ctx.pathParams.organizationId);
}

export async function createOrganizationSsoDomain(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await getDB().transaction((transaction) => assertMutableDomains(ctx, transaction));
  const domain = normalizeDomain(ctx, ctx.request.body.domain);
  const { domains, recordValue } = await getDomains(organizationId);
  assertKoaCondition(
    !domains.includes(domain),
    ctx,
    409,
    'This single sign-on domain is already configured.',
  );
  let records: string[][];
  try {
    records = await dns.resolveTxt(`_appsemble-sso.${domain}`);
  } catch {
    throwKoaError(ctx, 400, 'The verification TXT record could not be found.');
  }
  assertKoaCondition(
    records.some((record) => record.join('') === recordValue),
    ctx,
    400,
    'The verification TXT record does not match this organization.',
  );
  await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    const [, created] = await OrganizationSsoDomain.findOrCreate({
      where: { OrganizationId: organizationId, domain },
      transaction,
    });
    assertKoaCondition(created, ctx, 409, 'This single sign-on domain is already configured.');
  });
  ctx.body = await getDomains(organizationId);
  ctx.status = 201;
}

export async function deleteOrganizationSsoDomain(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    const deleted = await OrganizationSsoDomain.destroy({
      where: {
        OrganizationId: organizationId,
        domain: normalizeDomain(ctx, ctx.pathParams.domain),
      },
      transaction,
    });
    assertKoaCondition(deleted > 0, ctx, 404, 'Single sign-on domain not found.');
  });
  ctx.status = 204;
}
