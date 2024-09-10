import { assertKoaError, throwKoaError, UserPropertiesError } from '@appsemble/node-utils';
import { has, Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, User } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function setAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { properties, role },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'id', 'demoMode'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        required: false,
        where: { UserId: memberId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (!app.demoMode) {
    await checkRole(ctx, app.OrganizationId, Permission.EditAppAccounts);
  }

  const user = await User.findByPk(memberId);

  assertKoaError(!user, ctx, 404, 'User with this ID doesn’t exist.');
  assertKoaError(
    !has(app.definition.security.roles, role),
    ctx,
    404,
    `Role ‘${role}’ is not defined`,
  );

  let member = app.AppMembers?.[0];

  const parsedUserProperties: Record<string, any> = {};
  if (properties) {
    for (const [propertyName, propertyValue] of Object.entries(properties)) {
      try {
        parsedUserProperties[propertyName] = JSON.parse(propertyValue as string);
      } catch {
        parsedUserProperties[propertyName] = propertyValue;
      }
    }
  }

  try {
    if (member) {
      member.role = role;
      member.properties = parsedUserProperties;
      await member.save();
    } else {
      member = await AppMember.create({
        email: user.primaryEmail,
        UserId: user.id,
        AppId: app.id,
        timezone: user.timezone,
        role,
        properties: parsedUserProperties,
      });
    }
  } catch (error) {
    if (error instanceof UserPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
  }

  ctx.body = {
    userId: user.id,
    memberId: member.id,
    name: member.name,
    primaryEmail: member.email,
    role,
    properties: member.properties,
  };
}
