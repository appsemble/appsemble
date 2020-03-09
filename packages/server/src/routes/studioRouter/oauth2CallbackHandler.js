import qs from 'qs';

import getUserInfo from '../../utils/getUserInfo';
import indexHandler from './indexHandler';

export default async function oauth2CallbackHandler(ctx, next) {
  const { OAuthAuthorization } = ctx.db.models;
  const { code } = ctx.query;
  const { provider } = ctx.session.grant;
  const authorization = await OAuthAuthorization.findOne({
    where: { provider, code },
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
      ({ sub } = await getUserInfo(provider, params.access_token));
    }
    await OAuthAuthorization.upsert(
      {
        id: sub,
        provider,
        token: params.access_token,
        refreshToken: params.refresh_token,
        code,
      },
      { raw: true },
    );
  }
  return indexHandler(ctx);
}
