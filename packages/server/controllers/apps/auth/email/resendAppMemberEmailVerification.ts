import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function resendAppMemberEmailVerification(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    user: authInfo,
  } = ctx;
  const { AppMember, AppMemberEmailAuthorization } = await getAppDB(appId);

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

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');

  const appMember = await AppMember.findByPk(authInfo!.id, {
    attributes: {
      exclude: ['picture'],
    },
    include: {
      model: AppMemberEmailAuthorization,
      where: {
        verified: false,
      },
      required: false,
    },
  });

  assertKoaCondition(appMember != null, ctx, 404, 'App member with this email could not be found.');

  assertKoaCondition(
    !appMember.emailVerified || Boolean(appMember.AppMemberEmailAuthorizations.length),
    ctx,
    400,
    'The email of this app member has already been verified.',
  );

  const url = new URL('/Verify', getAppUrl(app));
  url.searchParams.set(
    'token',
    appMember.AppMemberEmailAuthorizations?.[0]?.key ?? appMember.emailKey ?? '',
  );

  mailer
    .sendTranslatedEmail({
      appId,
      emailName: 'resend',
      locale: appMember.locale,
      to: appMember.AppMemberEmailAuthorizations?.[0]
        ? { email: appMember.AppMemberEmailAuthorizations?.[0]?.email, name: appMember.name }
        : appMember,
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
