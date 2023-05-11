import { readFile } from 'node:fs/promises';

import { type GetAppSubEntityParams, readAsset } from '@appsemble/node-utils';

export function getAppIcon({ app }: GetAppSubEntityParams): Promise<Buffer> {
  return app.iconUrl ? readFile(app.iconUrl) : readAsset('appsemble.png');
}
