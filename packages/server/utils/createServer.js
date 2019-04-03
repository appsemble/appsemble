#!/usr/bin/env node
import path from 'path';
// import querystring from 'querystring';

import faPkg from '@fortawesome/fontawesome-free/package.json';
import bcrypt from 'bcrypt';
// import boom from 'boom';
import Koa from 'koa';
import compress from 'koa-compress';
import Grant from 'grant-koa';
import jwt from 'jsonwebtoken';
import mount from 'koa-mount';
import koaQuerystring from 'koa-qs';
import serve from 'koa-static';
import session from 'koa-session';
import koasBodyParser from 'koas-body-parser';
import koas from 'koas-core';
import koasOAuth2Server from 'koas-oauth2-server';
import koasOperations from 'koas-operations';
import koasParameters from 'koas-parameters';
import koasSerializer from 'koas-serializer';
import koasSpecHandler from 'koas-spec-handler';
import koasStatusCode from 'koas-status-code';
import koasSwaggerUI from 'koas-swagger-ui';
import raw from 'raw-body';

import api from '../api';
import * as operations from '../controllers';
import boomMiddleware from '../middleware/boom';
import routes from '../routes';

export default async function createServer({
  app = new Koa(),
  argv = {},
  db,
  smtp,
  grantConfig,
  secret = 'appsemble',
}) {
  // eslint-disable-next-line no-param-reassign
  app.keys = [secret];
  app.use(session(app));

  app.use(boomMiddleware);
  Object.assign(app.context, { argv, db });

  let grant;
  if (grantConfig) {
    grant = new Grant(grantConfig);
  }

  if (grantConfig) {
    // oauthRouter.get('/api/oauth/connect/:provider', (ctx, next) => {
    //   const { returnUri, ...query } = ctx.query;
    //   if (returnUri) {
    //     ctx.session.returnUri = returnUri;
    //     ctx.query = query;
    //   }
    //   return next();
    // });
    // oauthRouter.get('/api/oauth/callback/:provider', async ctx => {
    //   const code = ctx.query;
    //   const { provider } = ctx.params;
    //   const { OAuthAuthorization } = ctx.db.models;
    //   const config = grant.config[provider];
    //   const handler = oauth2Handlers[provider];
    //   if (!handler) {
    //     // unsupported provider
    //     throw boom.notFound('Unsupported provider');
    //   }
    //   const data = await handler(code, config);
    //   if (!data) {
    //     throw boom.internal('Unsupported provider');
    //   }
    //   const [auth] = await OAuthAuthorization.findOrCreate({
    //     where: { provider, id: data.id },
    //     defaults: {
    //       id: data.id,
    //       provider,
    //       token: code.access_token,
    //       expiresAt: code.raw.expires_in ? code.raw.expires_in : null,
    //       refreshToken: code.refresh_token,
    //       verified: data.verified,
    //     },
    //   });
    //   const qs =
    //     auth.verified && auth.UserId
    //       ? querystring.stringify({
    //           access_token: code.access_token,
    //           refresh_token: code.refresh_token,
    //           verified: auth.verified,
    //           userId: auth.UserId,
    //         })
    //       : querystring.stringify({
    //           access_token: code.access_token,
    //           refresh_token: code.refresh_token,
    //           provider,
    //           ...data,
    //         });
    //   const returnUri = ctx.session.returnUri ? `${ctx.session.returnUri}?${qs}` : `/?${qs}`;
    //   ctx.session.returnUri = null;
    //   ctx.redirect(returnUri);
    // });
  }

  koaQuerystring(app);

  app.use((ctx, next) => {
    ctx.state.smtp = smtp;
    return next();
  });
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (grantConfig) {
    app.use(mount('/api/oauth', grant));
  }

  app.use(
    mount(
      `/fa/${faPkg.version}`,
      serve(path.dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
    ),
  );

  const { EmailAuthorization, OAuthToken, Organization, User } = db.models;
  app.use(
    await koas(api(), [
      koasSpecHandler(),
      koasSwaggerUI({ url: '/api-explorer' }),
      koasOAuth2Server({
        async getAccessToken(accessToken) {
          const token = await OAuthToken.findOne({ where: { token: accessToken } });

          if (!token) {
            return null;
          }

          try {
            const payload = jwt.verify(accessToken, secret);

            const organizations = await Organization.findAll({
              include: {
                model: User,
                through: { where: { UserId: payload.sub } },
                required: true,
                attributes: [],
              },
            });

            return {
              accessToken,
              accessTokenExpiresAt: new Date(payload.exp * 1000),
              scope: payload.scopes,
              client: { id: payload.client_id },
              user: { id: payload.sub, organizations },
            };
          } catch (err) {
            return null;
          }
        },
        async getClient(clientId) {
          return {
            id: clientId,
            grants: ['password', 'refresh_token'],
          };
        },
        generateAccessToken(client, user, scope) {
          return jwt.sign(
            {
              scopes: scope,
              client_id: client.id,
              user,
            },
            secret,
            {
              issuer: 'appsemble-api',
              subject: `${user.id}`,
              expiresIn: 10800,
            },
          );
        },
        async getUser(username, password) {
          const email = await EmailAuthorization.findOne({ where: { email: username }, raw: true });

          if (!(email && (await bcrypt.compare(password, email.password)))) {
            return null;
          }

          const organizations = await Organization.findAll({
            include: {
              model: User,
              through: { where: { UserId: email.UserId } },
              required: true,
              attributes: [],
            },
          });

          return {
            id: email.UserId,
            verified: email.verified,
            email: email.email,
            name: email.name,
            organizations: organizations.map(({ id }) => ({ id })),
          };
        },
        async saveToken(token, client, user) {
          await OAuthToken.create({
            token: token.accessToken,
            refreshToken: token.refreshToken,
            UserId: user.id,
          });

          return {
            ...token,
            user,
            client,
          };
        },
      }),
      koasParameters(),
      koasBodyParser({
        '*/*': (body, mediaTypeObject, ctx) =>
          raw(body, {
            length: ctx.request.length,
          }),
      }),
      koasSerializer(),
      koasStatusCode(),
      koasOperations({ operations }),
    ]),
  );
  app.use(routes);

  return app.callback();
}
