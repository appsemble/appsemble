import { randomBytes } from 'node:crypto';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, AppMessages } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function requestAppMemberPasswordReset(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [
      'id',
      'definition',
      'domain',
      'path',
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'OrganizationId',
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');

  const email = request.body.email.toLowerCase();

  const appMember = await AppMember.findOne({
    where: { email, AppId: appId },
    attributes: {
      exclude: ['picture'],
    },
  });

  if (appMember) {
    await app.reload({
      include: {
        model: AppMessages,
        attributes: ['messages'],
        required: false,
        where: {
          language: appMember.locale ?? defaultLocale,
        },
      },
    });
    const resetKey = randomBytes(40).toString('hex');

    const url = new URL('/Edit-Password', getAppUrl(app));
    url.searchParams.set('token', resetKey);

    await appMember.update({ resetKey });

    mailer
      .sendTranslatedEmail({
        to: appMember,
        from: app.emailName,
        emailName: 'reset',
        appId,
        locale: appMember.locale,
        values: {
          link: (text) => `[${text}](${url})`,
          appName: app.AppMessages?.[0]?.messages?.app?.name ?? app.definition.name,
          name: appMember.name || 'null',
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
