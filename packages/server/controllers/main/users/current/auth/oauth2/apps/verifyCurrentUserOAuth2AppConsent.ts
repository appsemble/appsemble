import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../../../../models/index.js';
import { checkAppSecurityPolicy } from '../../../../../../../utils/auth.js';
import { createAppOAuth2AuthorizationCode } from '../../../../../../../utils/oauth2.js';

export async function verifyCurrentUserOAuth2AppConsent(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { redirectUri, scope },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const isAllowed = await checkAppSecurityPolicy(app, authSubject!.id);

  assertKoaCondition(
    isAllowed,
    ctx,
    400,
    'User is not allowed to login due to the app’s security policy',
    {
      isAllowed,
      appName: app.definition.name,
    },
  );

  const appMember = await AppMember.findOne({
    where: {
      AppId: app.id,
      UserId: authSubject!.id,
    },
  });

  assertKoaCondition(
    appMember != null && appMember.consent != null,
    ctx,
    400,
    'User has not agreed to the requested scopes',
    {
      isAllowed,
      appName: app.definition.name,
    },
  );

  const appOauth2AuthorizationCode = await createAppOAuth2AuthorizationCode(
    app,
    redirectUri,
    scope,
    appMember,
    ctx,
  );

  ctx.body = {
    code: appOauth2AuthorizationCode.code,
    isAllowed: true,
  };
}
