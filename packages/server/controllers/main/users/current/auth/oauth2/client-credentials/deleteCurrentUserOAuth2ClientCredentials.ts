import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OAuth2ClientCredentials } from '../../../../../../../models/index.js';

export async function deleteCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    pathParams: { clientId },
  } = ctx;

  const user = ctx.user!;

  const affectedRows = await OAuth2ClientCredentials.destroy({
    where: {
      id: clientId,
      UserId: user.id,
    },
  });

  assertKoaCondition(
    affectedRows !== 0,
    ctx,
    404,
    'No client credentials found for the given client id',
  );
}
