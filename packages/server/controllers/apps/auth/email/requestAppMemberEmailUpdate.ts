import { randomBytes } from 'node:crypto';

import { defaultLocale } from '@appsemble/lang-sdk';
import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function requestAppMemberEmailUpdate(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: { body },
    user: authInfo,
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'emailName', 'domain', 'path', 'OrganizationId'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { AppMember, AppMemberEmailAuthorization } = await getAppDB(appId);
  const { email } = body;
  const appMember = await AppMember.findByPk(authInfo?.id, {
    attributes: ['email', 'password', 'id', 'locale'],
  });
  assertKoaCondition(
    appMember?.password != null,
    ctx,
    400,
    "Can't change email for this app member.",
  );
  const appMemberExists = await AppMember.count({
    where: { email },
  });
  assertKoaCondition(
    !appMemberExists,
    ctx,
    409,
    'App member with this email address already exists.',
  );

  const emailAuth = await AppMemberEmailAuthorization.count({
    where: { email },
  });

  assertKoaCondition(!emailAuth, ctx, 409, 'App member with this email address already exists.');

  const emailKey = randomBytes(40).toString('hex');
  await AppMemberEmailAuthorization.create({
    AppMemberId: appMember.id,
    email,
    key: emailKey,
    verified: false,
  });
  const url = new URL(`/${appMember?.locale ?? defaultLocale}/Verify`, getAppUrl(app!));
  url.searchParams.set('token', emailKey);

  // This is purposely not awaited, so failure won’t make the request fail. If this fails, the user
  // will still be logged in, but will have to request a new verification email in order to verify
  // their account.
  mailer
    .sendTranslatedEmail({
      to: { email, name: appMember!.name },
      from: app!.emailName,
      appId,
      emailName: 'welcome',
      locale: appMember!.locale,
      values: {
        link: (text) => `[${text}](${url})`,
        appName: app!.AppMessages?.[0]?.messages?.app?.name ?? app!.definition.name,
        name: appMember!.name || 'null',
      },
      app: app!,
    })
    .catch((error: Error) => {
      logger.error(error);
    });
}
