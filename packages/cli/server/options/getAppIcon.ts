import { readFile } from 'node:fs/promises';

import { type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppIcon({ app }: GetAppSubEntityParams): Promise<Buffer> {
  return readFile(app.iconUrl);
}
