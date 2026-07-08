import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

function isBinaryValue(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function createWebhookBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body || {};
  }

  const entries = Object.entries(body);
  if (!entries.some(([, value]) => isBinaryValue(value))) {
    return body;
  }

  const formData = new FormData();
  for (const [key, value] of entries) {
    if (value === undefined) {
      continue;
    }
    formData.append(
      key,
      isBinaryValue(value) || typeof value === 'string' ? value : JSON.stringify(value),
    );
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
