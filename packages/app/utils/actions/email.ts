import axios from 'axios';

import { ActionCreator } from '.';
import { apiUrl, appId } from '../settings';

export const email: ActionCreator<'email'> = ({ prefixIndex }) => [
  async (data) => {
    const url = `${apiUrl}/api/apps/${appId}/action/${prefixIndex}`;
    await axios.post(url, data || {});

    return data;
  },
];
