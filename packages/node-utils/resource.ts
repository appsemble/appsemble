import { randomUUID } from 'node:crypto';

import {
  type AppDefinition,
  type ResourceDefinition,
  type Resource as ResourceType,
} from '@appsemble/types';
import { mapValues } from '@appsemble/utils';
import { addMilliseconds, isPast, parseISO } from 'date-fns';
import { type PreValidatePropertyFunction, ValidationError, Validator } from 'jsonschema';
import {
  type Context,
  type DefaultContext,
  type DefaultState,
  type ParameterizedContext,
} from 'koa';
import parseDuration from 'parse-duration';
import { type JsonObject, type JsonValue } from 'type-fest';

import { preProcessCSV } from './csv.js';
import { handleValidatorResult, type PreparedAsset, TempFile } from './index.js';
import { throwKoaError } from './koa.js';

export function stripResource({
  $author,
  $created,
  $editor,
  $ephemeral,
  $group,
  $seed,
  $updated,
  ...data
}: ResourceType): Record<string, unknown> {
  return data;
}

/**
 * Works on a resource, which has been processed on the server by the streamParser
 *
 * @param data The resource to be serialized, optionally containing parsed TempFile instance assets
 * @returns An object containing the resource and an array of the assets referenced
 *   from the resource
 */
export function serializeServerResource(
  data: any,
): JsonValue | { resource: JsonValue; assets: TempFile[] } {
  const assets: TempFile[] = [];
  const extractAssets = (value: Date | JsonValue | TempFile): JsonValue => {
    if (Array.isArray(value)) {
      return value.map(extractAssets);
    }
    if (value instanceof TempFile) {
      return String(assets.push(value) - 1);
    }
    if (value instanceof Date) {
      return value.toJSON();
    }
    if (value && typeof value === 'object') {
      return mapValues(value as JsonObject, extractAssets);
    }
    return value;
  };
  const resource = extractAssets(data);
  if (!assets.length) {
    return resource;
  }
  return {
    resource,
    assets,
  };
}

/**
 * Get the resource definition of an app by name.
 *
 * If there is no match, a 404 HTTP error is thrown.
 *
 * @param appDefinition The app definition to get the resource definition of
 * @param resourceType The name of the resource definition to get.
 * @param ctx Context used to throw back the errors.
 * @param view The view that’s being used.
 * @returns The matching resource definition.
 */
export function getResourceDefinition(
  appDefinition: AppDefinition,
  resourceType: string,
  ctx?: Context,
  view?: string,
): ResourceDefinition {
  if (!appDefinition) {
    if (ctx === undefined) {
      throw new Error('App not found');
    } else {
      throwKoaError(ctx, 404, 'App not found');
    }
  }

  const definition = appDefinition.resources?.[resourceType];

  if (!definition) {
    if (ctx === undefined || ctx.response === undefined) {
      throw new Error(`App does not have resources called ${resourceType}`);
    } else {
      throwKoaError(ctx, 404, `App does not have resources called ${resourceType}`);
    }
  }

  if (view && !definition.views?.[view]) {
    if (ctx === undefined) {
      throw new Error(`View ${view} does not exist for resource type ${resourceType}`);
    } else {
      throwKoaError(ctx, 404, `View ${view} does not exist for resource type ${resourceType}`);
    }
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
  ctx: Context | ParameterizedContext<DefaultState, DefaultContext, any>,
): [
  Record<string, unknown> | Record<string, unknown>[],
  TempFile[],
  PreValidatePropertyFunction | undefined,
] {
  let body: ResourceType | ResourceType[];
  let assets: TempFile[];
  let preValidateProperty: PreValidatePropertyFunction | undefined;

  if (ctx?.request?.body && ctx.is('multipart/form-data')) {
    ({ assets = [], resource: body } = ctx.request.body);

    if (Array.isArray(body) && body.length === 1) {
      [body] = body;
    }
  } else if (ctx?.request?.body) {
    if (ctx.is('text/csv')) {
      preValidateProperty = preProcessCSV;
    }
    ({ body } = ctx.request);
    assets = [];
  } else {
    ({ body } = ctx);
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
 * @param knownAssetNameIds A list of asset ids with asset names that already exist.
 * @param [isPatch] if the "PATCH" HTTP method is being used.
 * @returns A tuple which consists of:
 *
 *   1. One or more resources processed from the request body.
 *   2. A list of newly uploaded assets which should be linked to the resources.
 *   3. Asset IDs from the `knownAssetIds` array which are no longer used.
 */
export function processResourceBody(
  ctx: Context | ParameterizedContext<DefaultState, DefaultContext, any>,
  definition: ResourceDefinition,
  knownAssetIds: string[] = [],
  knownExpires?: Date,
  knownAssetNameIds: { id: string; name: string }[] = [],
  isPatch = false,
): [Record<string, unknown> | Record<string, unknown>[], PreparedAsset[], string[]] {
  const [resource, assets, preValidateProperty] = extractResourceBody(ctx);
  const validator = new Validator();
  const assetIdMap = new Map<number, string>();
  const assetUsedMap = new Map<number, boolean>();
  const reusedAssets = new Set<string>();

  const thumbnailAssets = [];
  const regularAssets = [];

  const thumbnailAssetSuffix = '-thumbnail.png';

  for (const asset of assets) {
    if (asset.filename?.endsWith(thumbnailAssetSuffix)) {
      thumbnailAssets.push(asset);
    } else {
      regularAssets.push(asset);
    }
  }

  const preparedRegularAssets = regularAssets.map<PreparedAsset>(
    ({ filename, mime, path }, index) => {
      const id = randomUUID();
      assetIdMap.set(index, id);
      assetUsedMap.set(index, false);
      return { path, filename, id, mime };
    },
  );

  const usedPreparedRegularAssets: string[] = [];
  const preparedThumbnailAssets = thumbnailAssets.map<PreparedAsset>(
    ({ filename, mime, path }, index) => {
      const regularAsset = preparedRegularAssets.find(
        (ra) =>
          !usedPreparedRegularAssets.includes(ra.id) &&
          ra.filename?.startsWith(filename.replace(thumbnailAssetSuffix, '')),
      );

      const id = regularAsset ? `${regularAsset.id}-thumbnail` : randomUUID();
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
      usedPreparedRegularAssets.push(regularAsset?.id);

      assetIdMap.set(index + preparedRegularAssets.length, id);
      assetUsedMap.set(index, false);
      return { path, filename, id, mime };
    },
  );

  const preparedAssets = [...preparedRegularAssets, ...preparedThumbnailAssets];

  validator.customFormats.binary = (input) => {
    if (knownAssetIds.includes(input)) {
      reusedAssets.add(input);
      return true;
    }
    const assetNameId = knownAssetNameIds.find((idName) => idName.name === input);
    if (assetNameId) {
      reusedAssets.add(assetNameId.id);
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
    required: ctx.request?.method === 'PATCH' || isPatch ? [] : definition.schema.required,
    properties: {
      ...definition.schema.properties,
      id: { type: 'integer' },
      $expires: {
        anyOf: [
          { type: 'string', format: 'date-time' },
          {
            type: 'string',
            pattern:
              /^(\d+(y|yr|years))?\s*(\d+months)?\s*(\d+(w|wk|weeks))?\s*(\d+(d|days))?\s*(\d+(h|hr|hours))?\s*(\d+(m|min|minutes))?\s*(\d+(s|sec|seconds))?$/
                .source,
          },
        ],
      },
      $clonable: { type: 'boolean' },
      $thumbnails: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
      },
      ...Object.fromEntries(
        Object.values(definition.references ?? {}).map((reference) => [
          `$${reference.resource}`,
          { type: 'integer' },
        ]),
      ),
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
      rewrite(value, { format, oneOf }, options, { path }) {
        let propertyName;
        if (Array.isArray(resource) && path.length === 2 && typeof path[0] === 'number') {
          propertyName = path[1];
        } else if (path.length === 1) {
          propertyName = path[0];
        }

        if (propertyName === '$thumbnails') {
          return;
        }

        if (propertyName === '$expires') {
          if (value !== undefined) {
            const date = parseISO(value);

            if (Number.isNaN(date.getTime())) {
              // @ts-expect-error 2345 argument of type is not assignable to parameter of type
              // (strictNullChecks) - Severe
              return addMilliseconds(new Date(), parseDuration(value));
            }

            if (
              isPast(date) &&
              !customErrors.some(
                (error) => error.message === 'has already passed' && error.path === path,
              )
            ) {
              customErrors.push(new ValidationError('has already passed', value, undefined, path));
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
          if (propertyName === '$clonable') {
            return definition.clonable;
          }
          return;
        }
        if (format !== 'binary' && !oneOf?.some((s) => s.format === 'binary')) {
          return value;
        }
        if (knownAssetIds.includes(value)) {
          return value;
        }
        if (value == null) {
          return value;
        }
        const num = Number(value);
        if (!assetIdMap.has(num)) {
          return value;
        }
        const uuid = assetIdMap.get(num);
        const currentResource = Array.isArray(resource) ? resource[path[0] as number] : resource;
        const preparedAsset = preparedAssets.find((asset) => asset.id === uuid);
        if (preparedAsset) {
          preparedAsset.resource = currentResource;
        }
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
          undefined,
          ['assets', assetId],
          'binary',
          'format',
        ),
      );
    }
  }

  handleValidatorResult(ctx, result, 'Resource validation failed');

  return [resource, preparedAssets, knownAssetIds.filter((id) => !reusedAssets.has(id))];
}
