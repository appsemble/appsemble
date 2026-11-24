import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  Organization,
  OrganizationSso,
  OrganizationSsoIdentity,
  User,
} from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { getOrganizationMemberRoles } from '../../../../utils/organizationSso.js';

export async function getOrganizationMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [
      {
        model: User,
        through: { where: { serviceAccount: false } },
      },
    ],
  });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  const member = await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: organization.id,
    requiredPermissions: [OrganizationPermission.QueryOrganizationMembers],
  });

  const sso = checkOrganizationRoleOrganizationPermissions(getOrganizationMemberRoles(member), [
    OrganizationPermission.UpdateOrganizationMemberRoles,
  ])
    ? await OrganizationSso.findByPk(organization.id, { attributes: ['issuer'] })
    : null;
  const identities = sso
    ? await OrganizationSsoIdentity.findAll({
        attributes: ['UserId', 'username'],
        where: {
          issuer: sso.issuer,
          UserId: organization.Users.map(({ id }) => id),
          username: { [Op.not]: null },
        },
        order: [['username', 'ASC']],
      })
    : [];

  ctx.body = organization.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.OrganizationMember!.role,
    roles: getOrganizationMemberRoles(user.OrganizationMember!),
    ssoRoles: user.OrganizationMember!.ssoRoles,
    guest: user.OrganizationMember!.guest,
    ...(sso && {
      ssoUsernames: identities
        .filter(({ UserId }) => UserId === user.id)
        .map(({ username }) => username),
    }),
  }));
}
