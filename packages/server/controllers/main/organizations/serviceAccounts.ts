import { randomBytes } from 'node:crypto';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { hash } from 'bcrypt';
import { isPast, parseISO } from 'date-fns';
import { type Context } from 'koa';

import {
  OAuth2ClientCredentials,
  OrganizationMember,
  transactional,
} from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { createServiceAccount, revokeServiceAccounts } from '../../../utils/serviceAccounts.js';

function formatServiceAccount(
  { created, description, expires, id, scopes }: OAuth2ClientCredentials,
  role: OrganizationMember['role'],
): Record<string, unknown> {
  return { id, description, role, scopes: scopes.split(' '), expires, created };
}

export async function getOrganizationServiceAccounts(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.QueryOrganizationMembers],
  });
  const members = await OrganizationMember.findAll({
    where: { OrganizationId: organizationId, serviceAccount: true },
  });
  const roles = new Map(members.map(({ role, UserId }) => [UserId, role]));
  const credentials = await OAuth2ClientCredentials.findAll({
    where: { UserId: [...roles.keys()] },
    order: [['created', 'ASC']],
  });
  ctx.body = credentials.map((client) => formatServiceAccount(client, roles.get(client.UserId)!));
}

export async function createOrganizationServiceAccount(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  const { description, expires, role, scopes } = ctx.request.body;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
  assertKoaCondition(
    expires == null || !isPast(parseISO(expires)),
    ctx,
    400,
    'These credentials have already expired',
  );
  const secret = randomBytes(32).toString('hex');
  const hashedSecret = await hash(secret, 10);
  const credentials = await transactional((transaction) =>
    createServiceAccount(
      {
        description,
        expires,
        id: randomBytes(16).toString('hex'),
        OrganizationId: organizationId,
        role,
        scopes: scopes.sort().join(' '),
        secret: hashedSecret,
      },
      transaction,
    ),
  );
  logger.info(
    `User ${ctx.user!.id} created service account ${credentials.id} for organization ${organizationId}`,
  );
  ctx.status = 201;
  ctx.body = { ...formatServiceAccount(credentials, role), secret };
}

export async function deleteOrganizationServiceAccount(ctx: Context): Promise<void> {
  const { clientId, organizationId } = ctx.pathParams;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
  const credentials = await OAuth2ClientCredentials.findByPk(clientId);
  const member =
    credentials &&
    (await OrganizationMember.findOne({
      where: { OrganizationId: organizationId, UserId: credentials.UserId, serviceAccount: true },
    }));
  assertKoaCondition(member != null, ctx, 404, 'Service account not found.');
  await transactional((transaction) =>
    revokeServiceAccounts({ OrganizationId: organizationId, UserId: member.UserId }, transaction),
  );
  logger.info(
    `User ${ctx.user!.id} revoked service account ${clientId} of organization ${organizationId}`,
  );
  ctx.status = 204;
}
