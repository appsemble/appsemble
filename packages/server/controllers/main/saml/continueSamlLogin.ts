import { type Context } from 'koa';

import {
  App,
  AppSamlAuthorization,
  AppSamlSecret,
  SamlLoginRequest,
  User,
} from '../../../models/index.js';
import { createAppOAuth2AuthorizationCode } from '../../../utils/oauth2.js';

export async function continueSamlLogin(ctx: Context): Promise<void> {
  const {
    request: {
      body: { id },
    },
    user,
  } = ctx;

  const loginRequest = await SamlLoginRequest.findByPk(id, {
    include: [
      { model: User },
      {
        model: AppSamlSecret,
        include: [{ model: App, attributes: ['domain', 'id', 'path', 'OrganizationId'] }],
      },
    ],
  });

  // The logged in account is linked to a new SAML authorization for next time.
  await AppSamlAuthorization.create({
    nameId: loginRequest.nameId,
    AppSamlSecretId: loginRequest.AppSamlSecret.id,
    UserId: loginRequest.User?.id ?? user.id,
  });

  const { code } = await createAppOAuth2AuthorizationCode(
    loginRequest.AppSamlSecret.App,
    loginRequest.redirectUri,
    loginRequest.scope,
    loginRequest.User ?? (user as User),
    ctx,
  );
  const redirect = new URL(loginRequest.redirectUri);
  redirect.searchParams.set('code', code);
  redirect.searchParams.set('state', loginRequest.state);
  ctx.body = { redirect };
}
