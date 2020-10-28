import { Permission } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';

import { App, AppMember, Organization, User } from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  appId: string;
  memberId: string;
}

export async function getAppMembers(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { include: [User] });
  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.AppMember.role,
  }));
}

export async function getAppMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: User, where: { id: memberId }, required: false }, Organization],
  });
  if (!app) {
    throw notFound('App not found');
  }

  if (app.definition.security === undefined) {
    throw notFound('App does not have a security definition.');
  }

  const { policy, role: defaultRole } = app.definition.security.default;

  const user = await User.findByPk(memberId);

  if (!user) {
    throw notFound('User does not exist.');
  }

  const member = app.Users.find((u) => u.id === memberId);
  let role = member ? member.AppMember.role : null;

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

export async function setAppMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, memberId },
    request: {
      body: { role },
    },
  } = ctx;

  const app = await App.findByPk(appId, { include: [User] });
  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditApps);

  const user = await User.findByPk(memberId);
  if (!user) {
    throw notFound('User with this ID doesn’t exist.');
  }

  if (!Object.hasOwnProperty.call(app.definition.security.roles, role)) {
    throw badRequest(`Role ‘${role}’ is not defined.`);
  }

  const [member] = await app.$get('Users', { where: { id: memberId } });

  if (member) {
    await (role === app.definition.security.default.role &&
    app.definition.security.default.policy !== 'invite'
      ? app.$remove('User', member)
      : member.AppMember.update({ role }));
  } else {
    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      role,
    });
  }

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}
