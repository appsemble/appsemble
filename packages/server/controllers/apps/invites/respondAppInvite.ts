import { randomBytes } from 'node:crypto';

import { assertKoaError, logger } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, AppInvite, AppMember } from '../../../models/index.js';
import { getAppUrl } from '../../../utils/app.js';

export async function respondAppInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { locale, password, response, timezone, token },
    },
  } = ctx;

  const invite = await AppInvite.findOne({ where: { key: token } });

  assertKoaError(!invite, ctx, 404, 'This token is invalid');

  const app = await App.findByPk(invite.AppId, { attributes: ['id', 'definition'] });

  assertKoaError(appId !== app.id, ctx, 406, 'App ids do not match');

  if (response) {
    const existingAppMember = await AppMember.findOne({ where: { email: invite.email } });

    assertKoaError(
      Boolean(existingAppMember),
      ctx,
      409,
      'App member with this email already exists',
    );

    const hashedPassword = await hash(password, 10);
    const key = randomBytes(40).toString('hex');

    await AppMember.create({
      AppId: appId,
      email: invite.email.toLowerCase(),
      role: invite.role,
      password: hashedPassword,
      emailKey: key,
      timezone,
      locale,
    });

    const url = new URL('/Verify', getAppUrl(app));
    url.searchParams.set('token', key);

    // This is purposely not awaited, so failure won’t make the request fail
    mailer
      .sendTranslatedEmail({
        to: { email: invite.email },
        from: app.emailName,
        appId,
        emailName: 'welcome',
        locale,
        values: {
          link: (text) => `[${text}](${url})`,
          appName: app.definition.name,
          name: 'null',
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  await invite.destroy();
}
