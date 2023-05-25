import { randomUUID } from 'node:crypto';

import { handleValidatorResult, logger, type PreparedAsset } from '@appsemble/node-utils';
import { type App, type ResourceDefinition, type Resource as ResourceType } from '@appsemble/types';
import { notFound } from '@hapi/boom';
import { addMilliseconds, isPast, parseISO } from 'date-fns';
import { type PreValidatePropertyFunction, ValidationError, Validator } from 'jsonschema';
import { type Context } from 'koa';
import { type File } from 'koas-body-parser';
import parseDuration from 'parse-duration';

import { preProcessCSV } from './csv.js';

function stripResource({
  $author,
  $created,
  $editor,
  $updated,
  ...data
}: ResourceType): Record<string, unknown> {
  return data;
}

/**
 * Get the resource definition of an app by name.
 *
 * If there is no match, a 404 HTTP error is thrown.
 *
 * @param app The app to get the resource definition of
 * @param resourceType The name of the resource definition to get.
 * @param view The view that’s being used.
 * @returns The matching resource definition.
 */
export function getResourceDefinition(
  app: App,
  resourceType: string,
  view?: string,
): ResourceDefinition {
  logger.log('/node-utils/resource app', app);
  if (!app) {
    throw notFound('App not found');
  }

  const definition = app.definition.resources?.[resourceType];

  if (!definition) {
    throw notFound(`App does not have resources called ${resourceType}`);
  }

  if (view && !definition.views[view]) {
    throw notFound(`View ${view} does not exist for resource type ${resourceType}`);
  }

  return definition;
}

/**
 * Extracts the IDs of resource request body.
 *
 * @param ctx The Koa context to extract the body from.
 * @returns A tuple which consists of:
 *
 *   1. One or more resources processed from the request body.
 *   2. A list of newly uploaded assets which should be linked to the resources.
 *   3. preValidateProperty function used for reconstructing resources from a CSV file.
 */
export function extractResourceBody(
  ctx: Context,
): [Record<string, unknown> | Record<string, unknown>[], File[], PreValidatePropertyFunction] {
  let body: ResourceType | ResourceType[];
  let assets: File[];
  let preValidateProperty: PreValidatePropertyFunction;

  if (ctx.is('multipart/form-data')) {
    ({ assets = [], resource: body } = ctx.request.body);
    if (Array.isArray(body) && body.length === 1) {
      [body] = body;
    }
  } else {
    if (ctx.is('text/csv')) {
      preValidateProperty = preProcessCSV;
    }
    ({ body } = ctx.request);
    assets = [];
  }

  return [
    Array.isArray(body) ? body.map(stripResource) : stripResource(body),
    assets,
    preValidateProperty,
  ];
}

/**
 * Process an incoming resource request body.
 *
 * This handles JSON schema validation, resource expiration, and asset linking and validation.
 *
 * @param ctx The Koa context to process.
 * @param definition The resource definition to use for processing the request body.
 * @param knownAssetIds A list of asset IDs that are already known to be linked to the resource.
 * @param knownExpires A previously known expires value.
 * @returns A tuple which consists of:
 *
 *   1. One or more resources processed from the request body.
 *   2. A list of newly uploaded assets which should be linked to the resources.
 *   3. Asset IDs from the `knownAssetIds` array which are no longer used.
 */
export function processResourceBody(
  ctx: Context,
  definition: ResourceDefinition,
  knownAssetIds: string[] = [],
  knownExpires?: Date,
): [Record<string, unknown> | Record<string, unknown>[], PreparedAsset[], string[]] {
  const [resource, assets, preValidateProperty] = extractResourceBody(ctx);
  const validator = new Validator();
  const assetIdMap = new Map<number, string>();
  const assetUsedMap = new Map<number, boolean>();
  const reusedAssets = new Set<string>();
  const preparedAssets = assets.map<PreparedAsset>(({ contents, filename, mime }, index) => {
    const id = randomUUID();
    assetIdMap.set(index, id);
    assetUsedMap.set(index, false);
    return { data: contents, filename, id, mime };
  });
  validator.customFormats.binary = (input) => {
    if (knownAssetIds.includes(input)) {
      reusedAssets.add(input);
      return true;
    }
    if (!/^\d+$/.test(input)) {
      return false;
    }
    const num = Number(input);
    if (assetUsedMap.get(num)) {
      return false;
    }
    return num >= 0 && num < assets.length;
  };

  const patchedSchema = {
    ...definition.schema,
    required: ctx.request.method === 'PATCH' ? [] : definition.schema.required,
    properties: {
      ...definition.schema.properties,
      id: { type: 'integer' },
      $expires: { type: 'string', format: 'date-time' },
      $clonable: { type: 'boolean' },
    },
  };
  const customErrors: ValidationError[] = [];
  const expiresDuration = definition.expires ? parseDuration(definition.expires) : undefined;
  const result = validator.validate(
    resource,
    Array.isArray(resource) ? { type: 'array', items: patchedSchema } : patchedSchema,
    {
      base: '#',
      preValidateProperty,
      nestedErrors: true,
      rewrite(value, { format }, options, { path }) {
        if (
          Array.isArray(resource)
            ? path.length === 2 && typeof path[0] === 'number' && path[1] === '$expires'
            : path.length === 1 && path[0] === '$expires'
        ) {
          if (value !== undefined) {
            const date = parseISO(value);
            if (isPast(date)) {
              customErrors.push(new ValidationError('has already passed', value, null, path));
            }
            return date;
          }
          if (knownExpires) {
            return knownExpires;
          }
          if (expiresDuration) {
            return addMilliseconds(new Date(), expiresDuration);
          }
        }
        if (value === undefined) {
          return;
        }
        if (format !== 'binary') {
          return value;
        }
        if (knownAssetIds.includes(value)) {
          return value;
        }
        const num = Number(value);
        if (!assetIdMap.has(num)) {
          return value;
        }
        const uuid = assetIdMap.get(num);
        const currentResource = Array.isArray(resource) ? resource[path[0] as number] : resource;
        preparedAssets.find((asset) => asset.id === uuid).resource = currentResource;
        assetUsedMap.set(num, true);
        return uuid;
      },
    },
  );

  result.errors.push(...customErrors);

  for (const [assetId, used] of assetUsedMap.entries()) {
    if (!used) {
      result.errors.push(
        new ValidationError(
          'is not referenced from the resource',
          assetId,
          null,
          ['assets', assetId],
          'binary',
          'format',
        ),
      );
    }
  }

  handleValidatorResult(result, 'Resource validation failed');

  return [resource, preparedAssets, knownAssetIds.filter((id) => !reusedAssets.has(id))];
}
