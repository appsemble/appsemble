import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { getAppUrl } from '../../../utils/app.js';

export async function respondAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, token },
    request: {
      body: { locale, password, response, timezone },
    },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'path', 'demoMode'],
  });
  assertKoaCondition(app != null, ctx, 404, 'This app does not exist');

  const { AppInvite, AppMember } = await getAppDB(appId);
  const invite = await AppInvite.findOne({ where: { key: token } });

  assertKoaCondition(invite != null, ctx, 404, 'This token is invalid');

  if (response) {
    const existingAppMember = await AppMember.findOne({
      where: { email: invite.email },
    });

    const hashedPassword = await hash(password, 10);
    const key = randomBytes(40).toString('hex');

    await (existingAppMember
      ? existingAppMember.update({ role: invite.role, password: hashedPassword })
      : AppMember.create({
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
