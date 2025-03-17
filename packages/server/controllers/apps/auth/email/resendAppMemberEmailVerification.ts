import { assertKoaCondition, logger } from '@appsemble/node-utils';
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
  });

  assertKoaCondition(!!app, ctx, 404, 'App could not be found.');

  const appMember = await AppMember.findOne({
    where: { email },
    attributes: {
      exclude: ['picture'],
    },
  });

  assertKoaCondition(!!appMember, ctx, 404, 'App member with this email could not be found.');

  assertKoaCondition(
    !appMember.emailVerified,
    ctx,
    400,
    'The email of this app member has already been verified.',
  );

  const url = new URL('/Verify', getAppUrl(app));
  url.searchParams.set('token', appMember.emailKey);

  mailer
    .sendTranslatedEmail({
      appId,
      emailName: 'resend',
      locale: appMember.locale,
      to: appMember,
      values: {
        link: (text) => `[${text}](${url})`,
        name: appMember.name || 'null',
        appName: app.definition.name,
      },
      app,
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.status = 204;
}
