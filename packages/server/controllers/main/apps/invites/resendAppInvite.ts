import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppInvite, User } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function resendAppInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'domain', 'path'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppInvites],
  });

  const email = request.body.email.toLowerCase();
  const existingAppInvite = await AppInvite.findOne({
    where: {
      AppId: appId,
      email,
    },
    include: [User],
  });

  assertKoaCondition(
    existingAppInvite != null,
    ctx,
    404,
    'This person was not invited previously.',
  );

  const url = new URL('/App-Invite', getAppUrl(app));
  url.searchParams.set('token', existingAppInvite.key);

  try {
    await mailer.sendTranslatedEmail({
      appId,
      to: {
        ...(existingAppInvite.User ? { name: existingAppInvite.User.name } : {}),
        email,
      },
      emailName: 'appInvite',
      ...(app.definition.defaultLanguage ? { locale: app.definition.defaultLanguage } : {}),
      ...(existingAppInvite.User ? { locale: existingAppInvite.User.locale } : {}),
      values: {
        link: (text) => `[${text}](${String(url)})`,
        name: existingAppInvite.User?.name || 'null',
        appName: app.definition.name,
      },
    });
  } catch (error: any) {
    throwKoaError(ctx, 400, error.message || 'Something went wrong when sending the invite.');
  }

  ctx.body = 204;
}
