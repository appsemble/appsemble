import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const webhook: ActionCreator<'webhook'> = ({ definition, remap }) => [
  async (data, context) => {
    // Remap body if specified, otherwise pass through data
    const body = definition.body ? remap(definition.body, data, context) : data;

    // Call the webhook endpoint directly
    const url = `${apiUrl}/api/apps/${appId}/webhooks/${definition.name}`;
    const response = await axios.post(url, body || {});

    // Return the response data from the webhook execution
    return response.data;
  },
];
