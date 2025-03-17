import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OAuth2ClientCredentials } from '../../../../../../../models/index.js';

export async function deleteCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    pathParams: { clientId },
    user,
  } = ctx;

  const affectedRows = await OAuth2ClientCredentials.destroy({
    where: {
      id: clientId,
      UserId: user.id,
    },
  });

  assertKoaCondition(
    !!affectedRows,
    ctx,
    404,
    'No client credentials found for the given client id',
  );
}
