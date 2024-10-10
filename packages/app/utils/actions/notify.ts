import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const notify: ActionCreator<'notify'> = ({ prefixIndex }) => [
  async (data) => {
    const url = `${apiUrl}/api/apps/${appId}/actions/${prefixIndex}`;
    await axios.post(url, data || {});

    return data;
  },
];
