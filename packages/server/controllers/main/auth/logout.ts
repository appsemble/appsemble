import { type Context } from 'koa';
import { buildEndSessionUrl } from 'openid-client';

import {
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
} from '../../../models/index.js';
import { argv } from '../../../utils/argv.js';
import { decrypt } from '../../../utils/crypto.js';
import { getOrganizationOidcConfiguration } from '../../../utils/organizationOidc.js';

export async function logout(ctx: Context): Promise<void> {
  const session = ctx.state.organizationSsoSessionId
    ? await OrganizationSsoSession.findOne({
        where: { id: ctx.state.organizationSsoSessionId },
        include: [{ model: OrganizationSsoIdentity, where: { UserId: ctx.user!.id } }],
      })
    : null;
  await session?.update({ interactiveRevoked: true });
  const sso = session?.idToken ? await OrganizationSso.findByPk(session.OrganizationId) : null;
  const config = sso ? await getOrganizationOidcConfiguration(sso) : null;
  ctx.body =
    session?.idToken && config?.serverMetadata().end_session_endpoint
      ? {
          endSessionUrl: String(
            buildEndSessionUrl(config, {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              id_token_hint: decrypt(session.idToken, argv.aesSecret),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              post_logout_redirect_uri: String(new URL('/', argv.host)),
            }),
          ),
        }
      : {};
}
