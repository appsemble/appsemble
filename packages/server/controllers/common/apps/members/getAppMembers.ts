import { assertKoaError } from '@appsemble/node-utils';
import { type AppMember as AppMemberType } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember, Organization, User } from '../../../../models/index.js';

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        include: [User],
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMembers: AppMemberType[] = app.AppMembers.map((member) => ({
    userId: member.UserId,
    memberId: member.id,
    demo: member.User.demoLoginUser,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
    properties: member.properties,
  }));

  if (app.definition.security?.default?.policy !== 'invite') {
    const organization = await Organization.findByPk(app.OrganizationId, {
      include: [
        {
          model: User,
          where: { id: { [Op.not]: app.AppMembers.map((member) => member.UserId) } },
          required: false,
        },
      ],
    });

    for (const orgUser of organization.Users) {
      appMembers.push({
        userId: orgUser.id,
        memberId: orgUser.AppMember?.id,
        demo: orgUser.demoLoginUser,
        name: orgUser.name,
        primaryEmail: orgUser.primaryEmail,
        properties: orgUser?.AppMember?.properties,
        role: orgUser?.AppMember?.role ?? app.definition.security.default.role,
      });
    }
  }

  ctx.body = appMembers;
}
