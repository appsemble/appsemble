import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, EmailAuthorization, User } from '../../../../../../../models/index.js';
import {
  checkAppSecurityPolicy,
  handleUniqueAppMemberEmailIndex,
} from '../../../../../../../utils/auth.js';
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

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(
    await checkAppSecurityPolicy(app, authSubject.id),
    ctx,
    401,
    'User is not allowed to login due to the app’s security policy',
    { isAllowed: false },
  );

  if (appMember) {
    await appMember.update({ consent: new Date() });
  } else {
    const emailAuthorization = await EmailAuthorization.findOne({
      where: {
        email: user.primaryEmail,
      },
    });

    try {
      appMember = await AppMember.create({
        AppId: app.id,
        UserId: user.id,
        name: user.name,
        email: user.primaryEmail,
        timezone: user.timezone,
        emailVerified: emailAuthorization?.verified ?? false,
        role: app.definition.security.default.role,
        consent: new Date(),
      });
    } catch (error) {
      await handleUniqueAppMemberEmailIndex(
        ctx,
        error,
        user.primaryEmail,
        emailAuthorization?.verified ?? false,
        (data) => {
          throwKoaError(ctx, 409, 'Account already exists for this email.', {
            externalId: user.id,
            secret: 'user:',
            ...data,
          });
        },
      );
    }
  }

  ctx.body = await createAppOAuth2AuthorizationCode(app, redirectUri, scope, appMember, ctx);
}
