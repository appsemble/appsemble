import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, AppInvite, AppMember } from '../../../models/index.js';
import { getAppUrl } from '../../../utils/app.js';

export async function respondAppInvite(ctx: Context): Promise<void> {
  const {
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

  assertKoaCondition(app != null, ctx, 404, 'This app does not exist');

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
          emailKey: null,
          emailVerified: true,
          timezone,
          locale,
          demo: app.demoMode,
        }));

    const url = new URL('/Verify', getAppUrl(app));
    url.searchParams.set('token', key);
  }

  await invite.destroy();
}
