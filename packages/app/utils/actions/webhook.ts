import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

function isBinaryValue(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function appendFormValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined) {
    return;
  }
  formData.append(
    key,
    isBinaryValue(value) || typeof value === 'string' ? value : JSON.stringify(value),
  );
}

function extractBinaryValues(
  value: unknown,
  path: string[],
  formData: FormData,
): [unknown, boolean] {
  if (isBinaryValue(value)) {
    appendFormValue(formData, path.join('.') || 'file', value);
    return [undefined, true];
  }
  if (Array.isArray(value)) {
    let hasBinary = false;
    const jsonValue = value.map((entry, index) => {
      const [item, itemHasBinary] = extractBinaryValues(entry, [...path, String(index)], formData);
      hasBinary ||= itemHasBinary;
      return item;
    });
    return [jsonValue, hasBinary];
  }
  if (value && typeof value === 'object') {
    let hasBinary = false;
    const jsonValue = Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) => {
        const [item, itemHasBinary] = extractBinaryValues(entry, [...path, key], formData);
        hasBinary ||= itemHasBinary;
        return item === undefined ? [] : [[key, item]];
      }),
    );
    return [jsonValue, hasBinary];
  }
  return [value, false];
}

function createWebhookBody(body: unknown): unknown {
  const formData = new FormData();
  const [jsonBody, hasBinary] = extractBinaryValues(body, [], formData);
  if (!hasBinary) {
    return body || {};
  }
  if (jsonBody && typeof jsonBody === 'object' && !Array.isArray(jsonBody)) {
    for (const [key, value] of Object.entries(jsonBody)) {
      appendFormValue(formData, key, value);
    }
  }
  return formData;
}

export const webhook: ActionCreator<'webhook'> = ({ definition, remap }) => [
  async (data, context) => {
    // Remap body if specified, otherwise pass through data
    const body = definition.body ? remap(definition.body, data, context) : data;

    // Call the webhook endpoint directly
    const url = `${apiUrl}/api/apps/${appId}/webhooks/${definition.name}`;
    const response = await axios.post(url, createWebhookBody(body));

    // Return the response data from the webhook execution
    return response.data;
  },
];
