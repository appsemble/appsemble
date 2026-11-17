import { randomBytes } from 'node:crypto';
import dns from 'node:dns/promises';

import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { type Transaction } from 'sequelize';

import {
  getDB,
  Organization,
  OrganizationSso,
  OrganizationSsoDomain,
} from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import {
  getOrganizationSsoDomainSettings,
  normalizeOrganizationSsoDomain,
} from '../../../utils/organizationSsoDomain.js';

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

export async function getOrganizationSsoDomains(ctx: Context): Promise<void> {
  await checkDomainPermissions(ctx);
  const claims = await OrganizationSsoDomain.findAll({
    where: { OrganizationId: ctx.pathParams.organizationId },
    order: [['domain', 'ASC']],
  });
  ctx.body = claims.map(getOrganizationSsoDomainSettings);
}

export async function createOrganizationSsoDomain(ctx: Context): Promise<void> {
  const claim = await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    let domain: string;
    try {
      domain = normalizeOrganizationSsoDomain(ctx.request.body.domain);
    } catch (error) {
      throwKoaError(ctx, 400, (error as Error).message);
    }
    const [result, created] = await OrganizationSsoDomain.findOrCreate({
      where: { OrganizationId: ctx.pathParams.organizationId, domain },
      defaults: { token: randomBytes(32).toString('hex'), managedBy: 'studio' },
      transaction,
    });
    assertKoaCondition(created, ctx, 409, 'This single sign-on domain is already configured.');
    return result;
  });
  ctx.body = getOrganizationSsoDomainSettings(claim);
  ctx.status = 201;
}

export async function deleteOrganizationSsoDomain(ctx: Context): Promise<void> {
  await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    const claim = await OrganizationSsoDomain.findOne({
      where: { OrganizationId: ctx.pathParams.organizationId, domain: ctx.pathParams.domain },
      transaction,
    });
    assertKoaCondition(claim != null, ctx, 404, 'Single sign-on domain not found.');
    assertKoaCondition(
      claim.managedBy === 'studio',
      ctx,
      409,
      'This single sign-on domain is managed by the deployment.',
    );
    await claim.destroy({ transaction });
  });
  ctx.status = 204;
}

export async function verifyOrganizationSsoDomain(ctx: Context): Promise<void> {
  const where = { OrganizationId: ctx.pathParams.organizationId, domain: ctx.pathParams.domain };
  const claim = await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    const current = await OrganizationSsoDomain.findOne({ where, transaction });
    assertKoaCondition(current != null, ctx, 404, 'Single sign-on domain not found.');
    assertKoaCondition(
      current.managedBy === 'studio',
      ctx,
      409,
      'This single sign-on domain is managed by the deployment.',
    );
    return current;
  });
  const { recordName, recordValue } = getOrganizationSsoDomainSettings(claim);
  let records: string[][];
  try {
    records = await dns.resolveTxt(recordName);
  } catch {
    throwKoaError(ctx, 400, 'The verification TXT record could not be found.');
  }
  assertKoaCondition(
    claim.token != null && records.some((record) => record.join('') === recordValue),
    ctx,
    400,
    'The verification TXT record does not match this organization.',
  );
  const verified = await getDB().transaction(async (transaction) => {
    await assertMutableDomains(ctx, transaction);
    const current = await OrganizationSsoDomain.findOne({ where, transaction });
    assertKoaCondition(
      current?.token === claim.token && current?.managedBy === 'studio',
      ctx,
      409,
      'The single sign-on domain changed during verification.',
    );
    return current.update({ verifiedAt: new Date() }, { transaction });
  });
  ctx.body = getOrganizationSsoDomainSettings(verified);
}
