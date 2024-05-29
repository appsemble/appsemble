import { type JsonObject, type JsonValue } from 'type-fest';

import { mapValues } from './mapValues.js';

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
