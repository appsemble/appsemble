import type { Next } from 'koa';
import qs, { ParsedQs } from 'qs';

import { OAuthAuthorization } from '../../models';
import type { KoaContext } from '../../types';
import getUserInfo from '../../utils/getUserInfo';
import indexHandler from './indexHandler';

export default async function oauth2CallbackHandler(ctx: KoaContext, next: Next): Promise<void> {
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
      ({ sub } = (params.id_token as ParsedQs).payload as ParsedQs);
    }
    if (sub == null) {
      ({ sub } = await getUserInfo(provider, (params as ParsedQs).access_token as string));
    }
    await OAuthAuthorization.upsert({
      id: sub,
      provider,
      token: params.access_token,
      refreshToken: params.refresh_token,
      code,
    });
  }
  return indexHandler(ctx);
}
