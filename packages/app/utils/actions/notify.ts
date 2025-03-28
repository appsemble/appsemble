import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const notify: ActionCreator<'notify'> = ({ appDefinition, prefixIndex }) => [
  async (data) => {
    const pageMatch = prefixIndex.match(/pages\.(\d+)/);
    const pageNumber = pageMatch ? Number(pageMatch[1]) : null;

    // Handle the prefixIndex for dynamically generated tabs
    let prefix = prefixIndex;
    if (
      pageNumber &&
      appDefinition.pages[pageNumber].type === 'tabs' &&
      appDefinition.pages[pageNumber].definition.foreach
    ) {
      prefix = prefix.replace(/tabs\.\d+/, 'definition.foreach');
    }

    const url = `${apiUrl}/api/apps/${appId}/actions/${prefix}`;
    await axios.post(url, data || {});

    return data;
  },
];
