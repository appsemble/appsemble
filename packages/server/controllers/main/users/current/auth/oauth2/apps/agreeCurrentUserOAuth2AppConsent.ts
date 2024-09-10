import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, EmailAuthorization, User } from '../../../../../../../models/index.js';
import { checkAppSecurityPolicy } from '../../../../../../../utils/auth.js';
import { createAppOAuth2AuthorizationCode } from '../../../../../../../utils/oauth2.js';

export async function agreeCurrentUserOAuth2AppConsent(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { redirectUri, scope },
    },
    user: authSubject,
  } = ctx;

  const user = await User.findByPk(authSubject.id);

  const app = await App.findByPk(appId, {
    attributes: ['domain', 'definition', 'id', 'path', 'OrganizationId'],
  });

  let appMember = await AppMember.findOne({
    where: {
      UserId: user.id,
    },
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(
    !(await checkAppSecurityPolicy(app, user, appMember)),
    ctx,
    401,
    'User is not allowed to login due to the app’s security policy',
    { isAllowed: false },
  );

  if (appMember) {
    await appMember.update({ consent: new Date() });
  } else {
    const userEmailAuthorization = await EmailAuthorization.findOne({
      where: {
        email: user.primaryEmail,
      },
    });

    appMember = await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      timezone: user.timezone,
      emailVerified: userEmailAuthorization?.verified ?? false,
      role: app.definition.security.default.role,
      consent: new Date(),
    });
  }

  ctx.body = await createAppOAuth2AuthorizationCode(app, redirectUri, scope, appMember, ctx);
}
