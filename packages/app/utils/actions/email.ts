import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const email: ActionCreator<'email'> = ({ prefixIndex }) => [
  async (data) => {
    const url = `${apiUrl}/api/apps/${appId}/actions/${prefixIndex}`;
    await axios.post(url, data || {});

    return data;
  },
];
