import NodeOAuthServer, { InvalidArgumentError, Request, Response } from 'oauth2-server';

async function handleResponse(ctx, response) {
  // XXX: Test whether this explicit redirect response is necessary to stay RFC 6749 compliant
  if (response.status === 302) {
    const { location } = response.headers;
    delete response.headers.location;
    ctx.set(response.headers);
    ctx.redirect(location);
  } else {
    ctx.set(response.headers);
    ctx.status = response.status;
    ctx.body = response.body;
  }
}

async function handleError(e, ctx, response, next, useErrorHandler) {
  if (useErrorHandler) {
    ctx.state.oauth = { error: e };
    await next();
    return;
  }

  if (response) {
    ctx.set(response.headers);
  }

  ctx.status = e.code;
  ctx.body = { error: e.name, error_description: e.message };
}

export default class oauth2Server {
  constructor({ continueMiddleware, useErrorHandler, ...options } = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.useErrorHandler = !!useErrorHandler;
    this.continueMiddleware = !!continueMiddleware;

    this.server = new NodeOAuthServer(options);
  }

  /**
   * Authentication Middleware.
   *
   * Returns a middleware this will validate a token.
   *
   * (See: https://tools.ietf.org/html/rfc6749#section-7)
   */
  authenticate(options) {
    return async (ctx, next) => {
      const request = new Request(ctx.request);
      const response = new Response(ctx.res);

      try {
        const token = await this.server.authenticate(request, response, options);
        ctx.state.oauth = { token };
      } catch (e) {
        await handleError(e, ctx, null, next, this.useErrorHandler);
        return;
      }

      await next();
    };
  }

  authorize(options) {
    return async (ctx, next) => {
      const request = new Request(ctx.request);
      const response = new Response(ctx.res);

      try {
        const code = await this.server.authorize(request, response, options);
        ctx.state.oauth = { code };
      } catch (e) {
        await handleError(e, ctx, response, next, this.useErrorHandler);
        return;
      }

      if (this.continueMiddleware) {
        await next();
      }

      await handleResponse(ctx, response);
    };
  }

  /**
   * Grant Middleware.
   *
   * Returns middleware this will grant tokens to valid requests.
   *
   * (See: https://tools.ietf.org/html/rfc6749#section-3.2)
   */
  token(options) {
    return async (ctx, next) => {
      const request = new Request(ctx.request);
      const response = new Response(ctx.res);
      let token;

      try {
        token = await this.server.token(request, response, options);
        ctx.state.oauth = { token };
      } catch (e) {
        await handleError(e, ctx, response, next, this.useErrorHandler);
        return;
      }

      if (this.continueMiddleware) {
        await next();
      }

      await handleResponse(ctx, response);
    };
  }
}
