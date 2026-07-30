import { type JsonObject, type JsonValue } from 'type-fest';

import { mapValues } from './mapValues.js';

interface ResourceSchema {
  format?: string;
  items?: unknown;
  properties?: Record<string, unknown>;
}

/**
 * Works on a resource on the client, for example passed from the form block
 *
 * @param data The resource to be serialized, optionally containing asset blobs
 * @returns A FormData instance containing the resource and an array of the assets
 *   referenced from the resource
 */
export function serializeResource(data: any): FormData | JsonValue {
  const assets: Blob[] = [];
  const extractAssets = (value: Blob | Date | JsonValue): JsonValue => {
    if (Array.isArray(value)) {
      return value.map(extractAssets);
    }
    if (value instanceof Blob) {
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
  const form = new FormData();
  form.set('resource', JSON.stringify(resource));
  for (const asset of assets) {
    form.append('assets', asset);
  }
  return form;
}

function asResourceSchema(schema: unknown): ResourceSchema | undefined {
  return schema && typeof schema === 'object' ? (schema as ResourceSchema) : undefined;
}

export function deserializeResource(data: any, schema?: unknown): any {
  const resource =
    typeof data.resource === 'string' ? (JSON.parse(data.resource) as JsonValue) : data.resource;
  const assets = Array.isArray(data.assets) ? data.assets : [data.assets];

  const replaceAssets = (value: JsonValue, valueSchema?: unknown): any => {
    const currentSchema = asResourceSchema(valueSchema);

    if (Array.isArray(value)) {
      const itemSchema = Array.isArray(currentSchema?.items) ? undefined : currentSchema?.items;
      return value.map((item) => replaceAssets(item, itemSchema));
    }
    if (
      typeof value === 'string' &&
      /^\d+$/.test(value) &&
      (!schema || currentSchema?.format === 'binary')
    ) {
      return assets[Number(value)];
    }
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, item] of Object.entries(value)) {
        result[key] = replaceAssets(item, currentSchema?.properties?.[key]);
      }
      return result;
    }
    return value;
  };

  return replaceAssets(resource, schema);
}
