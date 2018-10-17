import Boom from 'boom';
import { Plugin } from 'koa-oai-router';

export default class OAuth2Plugin extends Plugin {
  constructor(args) {
    console.log('oauth2plugin constructor', args);
    super(args);

    this.args = args;
    this.pluginName = 'oauth';
    this.field = 'security';
  }

  /* eslint-disable class-methods-use-this */
  handler({ fieldValue }) {
    return async (ctx, next) => {
      const { error, token } = ctx.state.oauth;

      if (error) {
        throw Boom.unauthorized(error.message);
      }

      const requiredScopes = fieldValue[0].oauthPassword;

      if (requiredScopes.length) {
        const oauthScopes = token.scope ? token.scope.split(' ') : undefined;
        if (!oauthScopes || !requiredScopes.every(scope => oauthScopes.includes(scope))) {
          throw Boom.unauthorized(`Required scopes: '${requiredScopes.join("', '")}'`);
        }
      }

      await next();
    };
  }
  /* eslint-enable class-methods-use-this */
}
