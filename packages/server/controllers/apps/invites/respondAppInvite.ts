import { randomBytes } from 'node:crypto';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, AppInvite, AppMember } from '../../../models/index.js';
import { getAppUrl } from '../../../utils/app.js';

export async function respondAppInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { token },
    request: {
      body: { locale, password, response, timezone },
    },
  } = ctx;

  const invite = await AppInvite.findOne({ where: { key: token } });

  assertKoaCondition(invite != null, ctx, 404, 'This token is invalid');

  const app = await App.findByPk(invite.AppId, {
    attributes: ['id', 'definition', 'OrganizationId', 'path', 'demoMode'],
  });

  if (response) {
    const existingAppMember = await AppMember.findOne({
      where: { AppId: app.id, email: invite.email },
    });

    const hashedPassword = await hash(password, 10);
    const key = randomBytes(40).toString('hex');

    await (existingAppMember
      ? existingAppMember.update({ role: invite.role, password: hashedPassword })
      : AppMember.create({
          AppId: app.id,
          email: invite.email.toLowerCase(),
          role: invite.role,
          password: hashedPassword,
          emailKey: key,
          timezone,
          locale,
          demo: app.demoMode,
        }));

    const url = new URL('/Verify', getAppUrl(app));
    url.searchParams.set('token', key);

    // This is purposely not awaited, so failure won’t make the request fail
    mailer
      .sendTranslatedEmail({
        to: { email: invite.email },
        from: app.emailName,
        appId: app.id,
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
