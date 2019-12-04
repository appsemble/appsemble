import axios from 'axios';
import qs from 'qs';

import indexHandler from './indexHandler';

export default async function oauth2CallbackHandler(ctx, next) {
  const { state } = ctx.query;
  const { OAuthAuthorization } = ctx.db.models;
  const authorization = await OAuthAuthorization.findOne({
    attributes: [],
    where: { state },
    raw: true,
  });
  if (!authorization) {
    await next();
    // grant assigns the token response to the Koa response body.
    const params = qs.parse(ctx.body);
    let sub;
    if (params.id_token) {
      ({ sub } = params.id_token.payload);
    }
    if (sub == null) {
      ({
        data: { sub },
      } = await axios.get('https://gitlab.com/oauth/userinfo', {
        headers: { authorization: `Bearer ${params.access_token}` },
      }));
    }
    await OAuthAuthorization.create(
      {
        id: sub,
        provider: ctx.session.grant.provider,
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
        state,
      },
      { raw: true },
    );
  }
  return indexHandler(ctx);
}
