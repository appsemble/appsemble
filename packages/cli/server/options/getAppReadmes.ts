import { readFile } from 'node:fs/promises';

import {
  type AppReadme as AppReadmeInterface,
  type GetAppSubEntityParams,
} from '@appsemble/node-utils';

export async function getAppReadmes({ app }: GetAppSubEntityParams): Promise<AppReadmeInterface[]> {
  const readme = await readFile(`${app.path}/readmes/${app.readmeUrl}`);

  return [
    {
      id: 0,
      file: readme,
    },
  ];
}
