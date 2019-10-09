import Boom from '@hapi/boom';
import Grant from 'grant';
import compose from 'koa-compose';
import mount from 'koa-mount';
import Router from 'koa-router';
import querystring from 'querystring';

import fetchProfile from '../utils/fetchProfile';

export default function oauth2(argv) {
  const { protocol, host } = new URL(argv.host);
  const grant = Grant.koa()({
    server: {
      // URL.protocol leaves a ´:´ in.
      protocol: protocol.replace(':', ''),
      host,
      path: '/api/oauth',
      callback: '/api/oauth/callback',
    },
    ...(argv.oauthGitlabKey && {
      gitlab: {
        key: argv.oauthGitlabKey,
        secret: argv.oauthGitlabSecret,
        scope: ['read_user'],
        callback: '/api/oauth/callback/gitlab',
      },
    }),
    ...(argv.oauthGoogleKey && {
      google: {
        key: argv.oauthGoogleKey,
        secret: argv.oauthGoogleSecret,
        scope: ['email', 'profile', 'openid'],
        callback: '/api/oauth/callback/google',
        custom_params: { access_type: 'offline' },
      },
    }),
  });
  const oauthRouter = new Router();
  oauthRouter.get('/api/oauth/connect/:provider', (ctx, next) => {
    const { returnUri, ...query } = ctx.query;
    if (returnUri) {
      ctx.session.returnUri = returnUri;
      ctx.query = query;
    }
    return next();
  });
  oauthRouter.get('/api/oauth/callback/:provider', async ctx => {
    const code = ctx.query;
    const { provider } = ctx.params;
    const { OAuthAuthorization } = ctx.db.models;
    const handler = fetchProfile[provider];
    if (!handler) {
      // unsupported provider
      throw Boom.notFound('Unsupported provider');
    }
    const data = await handler(code.access_token);
    if (!data) {
      throw Boom.internal('Unsupported provider');
    }
    const [auth] = await OAuthAuthorization.findOrCreate({
      where: { provider, id: data.id },
      defaults: {
        id: data.id,
        provider,
        token: code.access_token,
        expiresAt: code.raw.expires_in ? code.raw.expires_in : null,
        refreshToken: code.refresh_token,
        verified: data.verified,
      },
    });
    const qs =
      auth.verified && auth.UserId
        ? querystring.stringify({
            access_token: code.access_token,
            refresh_token: code.refresh_token,
            verified: auth.verified,
            userId: auth.UserId,
          })
        : querystring.stringify({
            access_token: code.access_token,
            refresh_token: code.refresh_token,
            provider,
            ...data,
          });
    const returnUri = ctx.session.returnUri ? `${ctx.session.returnUri}?${qs}` : `/?${qs}`;
    ctx.session.returnUri = null;
    ctx.redirect(returnUri);
  });
  return compose([oauthRouter.routes(), mount('/api/oauth', grant)]);
}
