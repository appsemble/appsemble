import { readFile } from 'node:fs/promises';

import { GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

export const getAppIcon = ({ app }: GetAppSubEntityParams): Promise<Buffer> =>
  readFile(app.iconUrl);
