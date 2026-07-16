import {
  assertKoaCondition,
  handleValidatorResult,
  isSerializedMultipartBody,
  logger,
  serializeServerResource,
} from '@appsemble/node-utils';
import { deserializeResource } from '@appsemble/utils';
import { type Schema, Validator } from 'jsonschema';
import { type Context } from 'koa';

import { App } from '../../../../models/index.js';
import { checkAppPermissions } from '../../../../options/checkAppPermissions.js';
import { options } from '../../../../options/options.js';
import { handleAction } from '../../../../utils/action.js';
import { actions } from '../../../../utils/actions/index.js';

function parseWebhookBody(body: Record<string, unknown>): unknown {
  return Object.hasOwn(body, 'resource') && Object.hasOwn(body, 'assets')
    ? deserializeResource(body)
    : body;
}

function validateWebhookBody(ctx: Context, body: unknown, schema: Schema): void {
  const validator = new Validator();
  const serializedBody = serializeServerResource(body);
  const validationBody = isSerializedMultipartBody(serializedBody)
    ? serializedBody.resource
    : serializedBody;
  const assetCount = isSerializedMultipartBody(serializedBody) ? serializedBody.assets.length : 0;

  validator.customFormats.binary = (input) => {
    const index = Number(input);
    return typeof input === 'string' && Number.isInteger(index) && index >= 0 && index < assetCount;
  };

  handleValidatorResult(
    ctx,
    validator.validate(validationBody || {}, schema, { nestedErrors: true }),
    'Webhook body validation failed',
  );
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

  const parsedBody = parseWebhookBody(body || {});

  validateWebhookBody(ctx, parsedBody, webhookDefinition.schema);

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
