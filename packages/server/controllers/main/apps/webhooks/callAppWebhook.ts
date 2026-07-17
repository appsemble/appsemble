import {
  assertKoaCondition,
  handleValidatorResult,
  isSerializedMultipartBody,
  logger,
  serializeServerResource,
} from '@appsemble/node-utils';
import { type Schema, Validator } from 'jsonschema';
import { type Context } from 'koa';
import { type JsonValue } from 'type-fest';

import { App } from '../../../../models/index.js';
import { checkAppPermissions } from '../../../../options/checkAppPermissions.js';
import { options } from '../../../../options/options.js';
import { handleAction } from '../../../../utils/action.js';
import { actions } from '../../../../utils/actions/index.js';

/**
 * Validate a webhook body against its schema and resolve uploaded assets nested anywhere in it.
 *
 * Files arrive either as a `{ resource, assets }` multipart envelope (the resource references each
 * asset by its index in the `assets` array) or as individual multipart fields (parsed into asset
 * instances in place). The resource is validated against the raw webhook schema, and only properties
 * declaring `format: binary` are resolved to their asset, so numeric string values elsewhere in the
 * body are left untouched.
 *
 * @param ctx The Koa context, used to detect multipart bodies and throw validation errors.
 * @param body The parsed request body.
 * @param schema The webhook's JSON schema.
 * @returns The validated resource with asset references replaced by their uploaded assets.
 */
function processWebhookBody(ctx: Context, body: Record<string, unknown>, schema: Schema): unknown {
  let resource: JsonValue;
  let assets: unknown[];

  if (
    ctx.is('multipart/form-data') &&
    Object.hasOwn(body, 'resource') &&
    Object.hasOwn(body, 'assets')
  ) {
    resource =
      typeof body.resource === 'string'
        ? (JSON.parse(body.resource) as JsonValue)
        : (body.resource as JsonValue);
    assets = Array.isArray(body.assets) ? body.assets : [body.assets];
  } else {
    const serialized = serializeServerResource(body);
    resource = isSerializedMultipartBody(serialized) ? serialized.resource : serialized;
    assets = isSerializedMultipartBody(serialized) ? serialized.assets : [];
  }

  const validator = new Validator();
  validator.customFormats.binary = (input) => {
    const index = Number(input);
    return (
      typeof input === 'string' && Number.isInteger(index) && index >= 0 && index < assets.length
    );
  };

  const result = validator.validate(resource ?? {}, schema, {
    nestedErrors: true,
    rewrite(value, propertySchema) {
      if (propertySchema.format === 'binary' && typeof value === 'string' && /^\d+$/.test(value)) {
        return assets[Number(value)];
      }
      return value;
    },
  });

  handleValidatorResult(ctx, result, 'Webhook body validation failed');

  return result.instance;
}

export async function callAppWebhook(ctx: Context): Promise<void> {
  const {
    client,
    mailer,
    pathParams: { appId, webhookName },
    request: { body },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'demoMode', 'domain', 'path', 'OrganizationId'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const webhookDefinition = app.definition.webhooks?.[webhookName];

  assertKoaCondition(webhookDefinition != null, ctx, 404, 'Webhook not found');

  // Webhook secret auth: user is truthy (empty object) but no client.app
  // App auth: user is truthy and client.app exists
  // Guest: user is falsy
  const clientApp = (client as { app?: unknown } | undefined)?.app;
  const isWebhookSecretAuth = user && !clientApp;

  // Check permissions for app auth and guest (not for webhook secret auth)
  if (!isWebhookSecretAuth) {
    logger.verbose(`Checking permissions for webhook '${webhookName}'`);
    await checkAppPermissions({
      context: ctx,
      app: app.toJSON(),
      permissions: [`$webhook:${webhookName}:invoke`],
    });
  }

  const parsedBody = processWebhookBody(ctx, body || {}, webhookDefinition.schema);

  logger.info(`Webhook '${webhookName}' received data:`);
  logger.info(JSON.stringify(parsedBody, null, 2));

  const action = actions[webhookDefinition.action.type];
  // @ts-expect-error Messed up
  const result = await handleAction(action, {
    app,
    action: webhookDefinition.action,
    mailer,
    data: parsedBody,
    options,
    context: ctx,
  });

  // Return the result to the client
  ctx.status = 200;
  ctx.body = result ?? null;
}
