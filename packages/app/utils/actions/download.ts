import { downloadBlob } from '@appsemble/web-utils';

import { ActionCreator } from './index.js';

export const download: ActionCreator<'download'> = ({ definition: { filename } }) => [
  (data) => {
    const blob =
      typeof data === 'string' || data instanceof Blob
        ? data
        : `${JSON.stringify(data, undefined, 2)}\n`;
    downloadBlob(blob, filename);
    return data;
  },
];
