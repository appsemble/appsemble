import { AppMember as AppMemberType } from '@appsemble/types';
import { has, Permission } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember, Organization, User } from '../models';
import { checkRole } from '../utils/checkRole';

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { include: [{ model: AppMember, include: [User] }] });
  if (!app) {
    throw notFound('App not found');
  }

  const appMembers: AppMemberType[] = app.AppMembers.map((member) => ({
    id: member.UserId,
    name: member.User.name,
    primaryEmail: member.User.primaryEmail,
    role: member.role,
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

    for (const user of organization.Users) {
      appMembers.push({
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: user?.AppMember?.role ?? app.definition.security.default.role,
      });
    }
  }

  ctx.body = appMembers;
}

export async function getAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, where: { UserId: memberId }, required: false }, Organization],
  });
  if (!app) {
    throw notFound('App not found');
  }

  if (app.definition.security === undefined) {
    throw notFound('App does not have a security definition.');
  }

  const { policy = 'everyone', role: defaultRole } = app.definition.security.default;

  const user = await User.findByPk(memberId);

  if (!user) {
    throw notFound('User does not exist.');
  }

  const member = app.AppMembers.find((m) => m.id === memberId);
  let role = member?.role ?? null;

  if (!member && policy === 'everyone') {
    role = defaultRole;
  }

  if (!member && policy === 'organization') {
    const isOrganizationMember = await app.Organization.$has('User', memberId);

    if (!isOrganizationMember) {
      throw notFound('User is not a member of the organization.');
    }

    role = defaultRole;
  }

  if (!member && policy === 'invite') {
    throw notFound('User is not a member of the app.');
  }

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}

export async function setAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { role },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, required: false, where: { UserId: memberId } }],
  });
  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditApps);

  const user = await User.findByPk(memberId);
  if (!user) {
    throw notFound('User with this ID doesn’t exist.');
  }

  if (!has(app.definition.security.roles, role)) {
    throw badRequest(`Role ‘${role}’ is not defined.`);
  }

  const member = app.AppMembers?.[0];

  await (member
    ? member.update({ role })
    : AppMember.create({
        UserId: user.id,
        AppId: app.id,
        role,
      }));

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, required: false, where: { UserId: memberId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (user.id !== memberId) {
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
  }

  const member = app.AppMembers?.[0];

  if (!member) {
    throw notFound('App member not found');
  }

  await member.destroy();
}
