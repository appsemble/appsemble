import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, type User } from '../../../../../../../models/index.js';
import { checkAppSecurityPolicy } from '../../../../../../../utils/auth.js';
import { createAppOAuth2AuthorizationCode } from '../../../../../../../utils/oauth2.js';

export async function verifyCurrentUserOAuth2AppConsent(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { redirectUri, scope },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { UserId: user.id }, required: false }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const isAllowed = await checkAppSecurityPolicy(app, user as User);

  assertKoaError(
    !isAllowed,
    ctx,
    400,
    'User is not allowed to login due to the app’s security policy',
    {
      isAllowed,
      appName: app.definition.name,
    },
  );
  assertKoaError(
    !app.AppMembers?.length || app.AppMembers[0].consent == null,
    ctx,
    400,
    'User has not agreed to the requested scopes',
    {
      isAllowed,
      appName: app.definition.name,
    },
  );

  ctx.body = {
    ...(await createAppOAuth2AuthorizationCode(app, redirectUri, scope, user as User, ctx)),
    isAllowed: true,
  };
}
