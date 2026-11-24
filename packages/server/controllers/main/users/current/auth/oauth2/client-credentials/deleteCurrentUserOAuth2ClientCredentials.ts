import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { tokenRevocation } from 'openid-client';

import {
  OAuth2ClientCredentials,
  OrganizationSso,
  OrganizationSsoSession,
} from '../../../../../../../models/index.js';
import { argv } from '../../../../../../../utils/argv.js';
import { decrypt } from '../../../../../../../utils/crypto.js';
import { getOrganizationOidcConfiguration } from '../../../../../../../utils/organizationOidc.js';

export async function deleteCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    pathParams: { clientId },
  } = ctx;

  const user = ctx.user!;

  const credentials = await OAuth2ClientCredentials.findOne({
    where: {
      id: clientId,
      UserId: user.id,
    },
    include: [OrganizationSsoSession],
  });

  assertKoaCondition(
    credentials != null,
    ctx,
    404,
    'No client credentials found for the given client id',
  );

  // The credentials stop working locally first, so a provider outage cannot keep them alive.
  const session = credentials.OrganizationSsoSession;
  await credentials.destroy();
  await session?.destroy();
  const sso = session?.refreshToken ? await OrganizationSso.findByPk(session.OrganizationId) : null;
  const config = sso ? await getOrganizationOidcConfiguration(sso) : null;
  if (session?.refreshToken && config?.serverMetadata().revocation_endpoint) {
    await tokenRevocation(config, decrypt(session.refreshToken, argv.aesSecret), {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_type_hint: 'refresh_token',
    });
  }
}
