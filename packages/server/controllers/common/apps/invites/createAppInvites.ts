import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  App,
  type AppInvite,
  EmailAuthorization,
  getAppDB,
  User,
} from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function createAppInvites(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    queryParams: { selectedGroupId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(
    app.definition.security != null,
    ctx,
    403,
    'App does not have a security definition.',
  );

  assertKoaCondition(
    (body as AppInvite[]).every((invite) =>
      getAppRoles(app.definition.security).find((role) => role === invite.role),
    ),
    ctx,
    403,
    'Role not allowed.',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.CreateAppInvites],
    groupId: selectedGroupId,
  });

  const { AppInvite, AppMember } = await getAppDB(appId);
  const appMembers = await AppMember.findAll({ attributes: ['email'] });

  const appInvites = await AppInvite.findAll({ attributes: ['email'] });

  const memberEmails = new Set(appMembers.flatMap(({ email }) => email));

  const newInvites = (body as AppInvite[])
    .map((invite) => ({
      email: invite.email.toLowerCase(),
      role: invite.role,
    }))
    .filter((invite) => !memberEmails.has(invite.email));

  assertKoaCondition(
    newInvites.length > 0,
    ctx,
    400,
    'All invited emails are already members of this app',
  );

  const existingInvites = new Set(appInvites.flatMap(({ email }) => email));

  const pendingInvites = newInvites.filter((invite) => !existingInvites.has(invite.email));

  assertKoaCondition(
    pendingInvites.length > 0,
    ctx,
    400,
    'All email addresses are already invited to this app',
  );

  const auths = await EmailAuthorization.findAll({
    include: [{ model: User }],
    where: { email: { [Op.in]: pendingInvites.map((invite) => invite.email) } },
  });

  const userMap = new Map(auths.map((auth) => [auth.email, auth.User]));

  const result = await AppInvite.bulkCreate(
    pendingInvites.map((invite) => {
      const user = userMap.get(invite.email);
      const key = randomBytes(20).toString('hex');
      return user
        ? {
            email: user?.primaryEmail ?? invite.email,
            userId: user.id,
            key,
            role: invite.role,
          }
        : { email: invite.email, role: invite.role, key, AppId: appId };
    }),
  );

  await Promise.all(
    result.map(async (invite) => {
      const user = await User.findOne({ where: { primaryEmail: invite.email } });

      const url = new URL('/App-Invite', getAppUrl(app));
      url.searchParams.set('token', invite.key);

      return mailer.sendTranslatedEmail({
        appId,
        to: {
          ...(user ? { name: user.name } : {}),
          email: invite.email,
        },
        emailName: 'appInvite',
        ...(app.definition.defaultLanguage ? { locale: app.definition.defaultLanguage } : {}),
        ...(user ? { locale: user.locale } : {}),
        values: {
          link: (text) => `[${text}](${String(url)})`,
          name: user?.name || 'null',
          appName: app.definition.name,
        },
      });
    }),
  );
  ctx.body = result.map(({ email, role }) => ({ email, role }));
}
