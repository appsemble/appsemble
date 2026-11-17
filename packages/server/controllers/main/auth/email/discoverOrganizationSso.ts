import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { Organization, OrganizationSso, OrganizationSsoDomain } from '../../../../models/index.js';
import { normalizeOrganizationSsoDomain } from '../../../../utils/organizationSsoDomain.js';

export async function discoverOrganizationSso(ctx: Context): Promise<void> {
  const { email, organizationId } = ctx.request.body;
  let domain: string;
  try {
    domain = normalizeOrganizationSsoDomain(email.slice(email.lastIndexOf('@') + 1));
  } catch (error) {
    throwKoaError(ctx, 400, (error as Error).message);
  }
  const contextual = organizationId
    ? await OrganizationSso.findByPk(organizationId, { include: [Organization] })
    : null;
  const providers = contextual
    ? [contextual]
    : (
        await OrganizationSsoDomain.findAll({
          where: { domain, verifiedAt: { [Op.ne]: null } },
          include: [{ model: OrganizationSso, required: true, include: [Organization] }],
          order: [['OrganizationId', 'ASC']],
        })
      ).map((claim) => claim.OrganizationSso!);
  ctx.body = {
    organizations: providers.map((sso) => ({
      id: sso.OrganizationId,
      name: sso.Organization!.name || sso.OrganizationId,
      ssoName: sso.name,
    })),
  };
  ctx.set('Cache-Control', 'no-store');
}
