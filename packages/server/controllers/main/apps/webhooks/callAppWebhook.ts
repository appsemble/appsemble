import { assertKoaCondition, handleValidatorResult, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { type OpenAPIV3 } from 'openapi-types';

import { App } from '../../../../models/index.js';
import { checkAppPermissions } from '../../../../options/checkAppPermissions.js';
import { options } from '../../../../options/options.js';
import { handleAction } from '../../../../utils/action.js';
import { actions } from '../../../../utils/actions/index.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && value.constructor === Object;
}

function patchBinarySchema(schema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject {
  return {
    ...schema,
    properties: Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([propertyName, propertySchema]) => {
        const schemaObject = propertySchema as OpenAPIV3.SchemaObject;
        if (schemaObject.type === 'string' && schemaObject.format === 'binary') {
          return [
            propertyName,
            {
              type: 'object',
              properties: {
                path: { type: 'string' },
                mime: { type: 'string' },
                filename: { type: 'string' },
              },
            },
          ];
        }
        return [
          propertyName,
          schemaObject.type === 'object' ? patchBinarySchema(schemaObject) : schemaObject,
        ];
      }),
    ),
  };
}

function getSchemaAtPath(
  schema: OpenAPIV3.SchemaObject,
  path: string[],
): OpenAPIV3.SchemaObject | undefined {
  let currentSchema: OpenAPIV3.SchemaObject | undefined = schema;
  for (const segment of path) {
    currentSchema = currentSchema.properties?.[segment] as OpenAPIV3.SchemaObject | undefined;
    if (!currentSchema) {
      return;
    }
  }
  return currentSchema;
}

function parseSchemaValue(schema: OpenAPIV3.SchemaObject | undefined, value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  switch (schema?.type) {
    case 'integer':
    case 'number':
      return Number(value);
    case 'boolean':
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
      return value;
    case 'object':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

function setNestedValue(
  target: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  const [property, ...remainingPath] = path;
  if (!remainingPath.length) {
    return {
      ...target,
      [property]:
        isPlainObject(target[property]) && isPlainObject(value)
          ? { ...value, ...target[property] }
          : value,
    };
  }
  return {
    ...target,
    [property]: setNestedValue(
      isPlainObject(target[property]) ? target[property] : {},
      remainingPath,
      value,
    ),
  };
}

function setValue(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  return {
    ...target,
    [key]:
      isPlainObject(target[key]) && isPlainObject(value) ? { ...value, ...target[key] } : value,
  };
}

function normalizeWebhookBody(
  body: unknown,
  schema: OpenAPIV3.SchemaObject,
): Record<string, unknown> | unknown {
  if (!isPlainObject(body)) {
    return body;
  }

  let normalizedBody: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const path = key.split('.');
    const propertySchema = getSchemaAtPath(schema, path);
    normalizedBody =
      path.length > 1 && propertySchema
        ? setNestedValue(normalizedBody, path, parseSchemaValue(propertySchema, value))
        : setValue(normalizedBody, key, parseSchemaValue(propertySchema, value));
  }
  return normalizedBody;
}

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

  const parsedSchema = patchBinarySchema(structuredClone(webhookDefinition.schema));
  const normalizedBody = normalizeWebhookBody(body || {}, webhookDefinition.schema);

  // XXX: unify with resource upload logic
  handleValidatorResult(
    ctx,
    openApi!.validate(normalizedBody || {}, parsedSchema, {
      throw: false,
    }),
    'Webhook body validation failed',
  );

  logger.info(`Webhook '${webhookName}' received data:`);
  logger.info(JSON.stringify(normalizedBody, null, 2));

  const action = actions[webhookDefinition.action.type];
  // @ts-expect-error Messed up
  const result = await handleAction(action, {
    app,
    action: webhookDefinition.action,
    mailer,
    data: normalizedBody,
    options,
    context: ctx,
  });

  // Return the result to the client
  ctx.status = 200;
  ctx.body = result ?? null;
}
