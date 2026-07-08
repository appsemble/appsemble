import { assertKoaCondition, handleValidatorResult, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { type OpenAPIV3 } from 'openapi-types';

import { App } from '../../../../models/index.js';
import { checkAppPermissions } from '../../../../options/checkAppPermissions.js';
import { options } from '../../../../options/options.js';
import { handleAction } from '../../../../utils/action.js';
import { actions } from '../../../../utils/actions/index.js';

export async function callAppWebhook(ctx: Context): Promise<void> {
  const {
    client,
    mailer,
    openApi,
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

  const parsedSchema = structuredClone(webhookDefinition.schema);
  parsedSchema.properties ??= {};
  for (const [propertyName, propertySchema] of Object.entries(parsedSchema.properties)) {
    const schemaObject = propertySchema as OpenAPIV3.SchemaObject;
    if (schemaObject.type === 'string' && schemaObject.format === 'binary') {
      parsedSchema.properties[propertyName] = {
        type: 'object',
        properties: {
          path: { type: 'string' },
          mime: { type: 'string' },
          filename: { type: 'string' },
        },
      };
    }
  }

  // XXX: unify with resource upload logic
  handleValidatorResult(
    ctx,
    openApi!.validate(body || {}, parsedSchema, {
      throw: false,
    }),
    'Webhook body validation failed',
  );

  logger.info(`Webhook '${webhookName}' received data:`);
  logger.info(JSON.stringify(body, null, 2));

  const action = actions[webhookDefinition.action.type];
  // @ts-expect-error Messed up
  const result = await handleAction(action, {
    app,
    action: webhookDefinition.action,
    mailer,
    data: body,
    options,
    context: ctx,
  });

  // Return the result to the client
  ctx.status = 200;
  ctx.body = result ?? null;
}
