import { logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function resendAppMemberEmailVerification(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();

  const app = await App.findByPk(appId, {
    attributes: [
      'definition',
      'domain',
      'path',
      'OrganizationId',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
    ],
    include: [
      { model: AppMember, attributes: { exclude: ['picture'] }, where: { email }, required: false },
    ],
  });

  if (app?.AppMembers.length && !app.AppMembers[0].emailVerified) {
    const url = new URL('/Verify', getAppUrl(app));
    url.searchParams.set('token', app.AppMembers[0].emailKey);

    mailer
      .sendTranslatedEmail({
        appId,
        emailName: 'resend',
        locale: app.AppMembers[0].locale,
        to: app.AppMembers[0],
        values: {
          link: (text) => `[${text}](${url})`,
          name: app.AppMembers[0].name || 'null',
          appName: app.definition.name,
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
