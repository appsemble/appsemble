import { type Context } from 'koa';

export function getAppScimServiceProviderConfig(ctx: Context): void {
  ctx.body = {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    patch: { supported: true },
    bulk: {
      supported: false,
      maxOperations: Number.MAX_SAFE_INTEGER,
      maxPayloadSize: Number.MAX_SAFE_INTEGER,
    },
    filter: { supported: false, maxResults: Number.MAX_SAFE_INTEGER },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [{ type: 'httpbasic', name: 'HTTPBasic', description: '' }],
  };
}
