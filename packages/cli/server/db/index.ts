import { join } from 'node:path';

import globalCacheDir from 'global-cache-dir';
import { Config, JsonDB } from 'node-json-db';

export async function getDb(appName: string): Promise<JsonDB> {
  const cacheDir = await globalCacheDir('appsemble');
  const dir = join(cacheDir, appName, 'db.json');
  const config = new Config(dir, true, true, '/');
  return new JsonDB(config);
}
