import { type Context } from 'koa';

import {
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
} from '../../../../../../../models/index.js';

export async function getCurrentUserOidcIdentities(ctx: Context): Promise<void> {
  ctx.set('Cache-Control', 'private, no-store');
  const identities = await OrganizationSsoIdentity.findAll({
    attributes: ['id', 'issuer', 'subject', 'username'],
    where: { UserId: ctx.user!.id },
    order: [
      ['issuer', 'ASC'],
      ['subject', 'ASC'],
    ],
  });
  const members = await OrganizationMember.findAll({
    attributes: ['OrganizationId'],
    where: { UserId: ctx.user!.id },
  });
  const configurations = await OrganizationSso.findAll({
    attributes: ['OrganizationId', 'issuer', 'name'],
    where: {
      issuer: identities.map(({ issuer }) => issuer),
      OrganizationId: members.map(({ OrganizationId }) => OrganizationId),
    },
    include: [{ model: Organization, attributes: ['name'], required: true }],
    order: [['OrganizationId', 'ASC']],
  });
  ctx.body = identities.map(({ id, issuer, subject, username }) => ({
    id,
    issuer,
    subject,
    username,
    organizations: configurations
      .filter((sso) => sso.issuer === issuer)
      .map((sso) => ({
        id: sso.OrganizationId,
        name: sso.Organization!.name,
        provider: sso.name,
      })),
  }));
}
