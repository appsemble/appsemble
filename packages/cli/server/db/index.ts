import { join } from 'node:path';

import globalCacheDir from 'global-cache-dir';
import { Config, JsonDB } from 'node-json-db';

export async function getDb(appName: string): Promise<JsonDB> {
  const dir = await globalCacheDir(`appsemble-${appName}`);
  const config = new Config(join(dir, 'db.json'), true, true, '/');
  return new JsonDB(config);
}
