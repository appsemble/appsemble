import { readFile } from 'node:fs/promises';

import { GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

export const getAppIcon = ({ app }: GetAppSubEntityParams): Promise<Buffer> =>
  readFile(app.iconUrl);
