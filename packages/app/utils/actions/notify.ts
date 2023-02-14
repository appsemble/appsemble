import axios from 'axios';

import { apiUrl, appId } from '../settings.js';
import { ActionCreator } from './index.js';

export const notify: ActionCreator<'notify'> = ({ prefixIndex }) => [
  async (data) => {
    const url = `${apiUrl}/api/apps/${appId}/action/${prefixIndex}`;
    await axios.post(url, data || {});

    return data;
  },
];
