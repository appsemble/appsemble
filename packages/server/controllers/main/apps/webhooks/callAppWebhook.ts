import { assertKoaCondition, handleValidatorResult } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { type OpenAPIV3 } from 'openapi-types';

import { App } from '../../../../models/index.js';
import { options } from '../../../../options/options.js';
import { handleAction } from '../../../../utils/action.js';
import { actions } from '../../../../utils/actions/index.js';

export async function callAppWebhook(ctx: Context): Promise<void> {
  const {
    mailer,
    openApi,
    pathParams: { appId, webhookName },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'demoMode'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const webhookDefinition = app.definition.webhooks?.[webhookName];

  assertKoaCondition(webhookDefinition != null, ctx, 404, 'Webhook not found');

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

  const action = actions[webhookDefinition.action.type];
  // @ts-expect-error Messed up
  await handleAction(action, {
    app,
    action: webhookDefinition.action,
    mailer,
    data: body,
    options,
    context: ctx,
  });
}
