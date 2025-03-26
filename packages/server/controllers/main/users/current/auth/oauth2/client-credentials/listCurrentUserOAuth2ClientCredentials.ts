import { type Context } from 'koa';
import { Op } from 'sequelize';

import { OAuth2ClientCredentials } from '../../../../../../../models/index.js';

export async function listCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const user = ctx.user!;

  const credentials = await OAuth2ClientCredentials.findAll({
    attributes: ['created', 'description', 'id', 'expires', 'scopes'],
    raw: true,
    where: {
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
      UserId: user.id,
    },
  });

  ctx.body = credentials.map(({ scopes, ...cred }) => ({
    ...cred,
    scopes: scopes.split(' '),
  }));
}
