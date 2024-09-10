import { randomBytes } from 'node:crypto';

import { logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';

export async function requestAppMemberPasswordReset(ctx: Context): Promise<void> {
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
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'OrganizationId',
    ],
    include: [
      { model: AppMember, attributes: { exclude: ['picture'] }, where: { email }, required: false },
    ],
  });

  if (app?.AppMembers.length) {
    const [member] = app.AppMembers;
    const resetKey = randomBytes(40).toString('hex');

    const url = new URL('/Edit-Password', getAppUrl(app));
    url.searchParams.set('token', resetKey);

    await member.update({ resetKey });
    mailer
      .sendTranslatedEmail({
        to: member,
        from: app.emailName,
        emailName: 'reset',
        appId,
        locale: member.locale,
        values: {
          link: (text) => `[${text}](${url})`,
          appName: app.definition.name,
          name: member.name || 'null',
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
