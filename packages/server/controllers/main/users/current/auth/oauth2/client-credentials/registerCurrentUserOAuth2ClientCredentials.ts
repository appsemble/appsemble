import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { isPast, parseISO } from 'date-fns';
import { type Context } from 'koa';

import { OrganizationSso, OrganizationSsoSession } from '../../../../../../../models/index.js';
import { createOAuth2ClientCredentials } from '../../../../../../../utils/oauth2.js';
import { startOrganizationSsoAuthorization } from '../../../../../../../utils/organizationOidc.js';

export async function registerCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    request: { body },
  } = ctx;
  const user = ctx.user!;

  let expires;
  if (body.expires) {
    expires = parseISO(body.expires);
    if (isPast(expires)) {
      throwKoaError(ctx, 400, 'These credentials have already expired');
    }
  }
  const scopes = body.scopes.sort().join(' ');

  if (ctx.state.loginMethod === 'oidc') {
    // Credentials of an organization SSO account rely on an offline grant of their own, so they
    // outlive the browser session at the provider.
    const session = await OrganizationSsoSession.findByPk(ctx.state.organizationSsoSessionId);
    const sso = session && (await OrganizationSso.findByPk(session.OrganizationId));
    assertKoaCondition(sso != null, ctx, 401, 'The organization SSO session has ended');
    ctx.body = {
      authorizationUrl: await startOrganizationSsoAuthorization(
        ctx,
        sso,
        {
          credentials: {
            userId: user.id,
            description: body.description,
            expires: body.expires,
            scopes,
          },
        },
        `${sso.scope} offline_access`,
      ),
      organizationId: sso.OrganizationId,
    };
    return;
  }

  ctx.body = await createOAuth2ClientCredentials({
    description: body.description,
    expires,
    scopes,
    UserId: user.id,
    loginMethod: ctx.state.loginMethod,
  });
}
