import { type Context } from 'koa';

import { Organization, OrganizationSso, OrganizationSsoDomain } from '../../../../models/index.js';
import { isOrganizationSsoIssuerAllowed } from '../../../../utils/organizationOidc.js';
import { normalizeOrganizationSsoDomain } from '../../../../utils/organizationSsoDomain.js';

export async function discoverOrganizationSso(ctx: Context): Promise<void> {
  const { email } = ctx.request.body;
  ctx.set('Cache-Control', 'no-store');
  let domain: string;
  try {
    domain = normalizeOrganizationSsoDomain(email.slice(email.lastIndexOf('@') + 1));
  } catch {
    ctx.body = { organizations: [] };
    return;
  }
  const claims = await OrganizationSsoDomain.findAll({
    where: { domain },
    include: [
      {
        model: OrganizationSso,
        required: true,
        include: [{ model: Organization, required: true }],
      },
    ],
    order: [['OrganizationId', 'ASC']],
  });
  ctx.body = {
    organizations: claims
      .map((claim) => claim.OrganizationSso!)
      .filter((sso) => isOrganizationSsoIssuerAllowed(sso))
      .map((sso) => ({
        id: sso.OrganizationId,
        name: sso.Organization!.name || sso.OrganizationId,
        ssoName: sso.name,
      })),
  };
}
