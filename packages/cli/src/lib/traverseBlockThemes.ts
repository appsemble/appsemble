import { join } from 'path';

import { logger, opendirSafe } from '@appsemble/node-utils';

import { uploadAppBlockTheme } from './uploadAppBlockTheme';

/**
 * Traverses the directory at a given path for app block themes and uploads them.
 *
 * @param path - The path of the app.
 * @param appId - The ID of the app.
 */
export async function traverseBlockThemes(path: string, appId: number): Promise<void> {
  logger.verbose(`Searching themes in ${path}`);
  await opendirSafe(
    join(path, 'theme'),
    async (orgDir, orgStats) => {
      const organizationId = orgStats.name.toLowerCase();
      if (organizationId === 'core' || organizationId === 'shared') {
        return;
      }
      if (!organizationId.startsWith('@')) {
        logger.warn('Block theme directories should be named “@organizationId/blockId”');
        return;
      }
      if (!orgStats.isDirectory()) {
        logger.warn(`Expected ${orgDir} to be a directory`);
        return;
      }
      await opendirSafe(orgDir, async (blockThemeDir, blockThemeStats) => {
        if (!blockThemeStats.isDirectory()) {
          logger.warn(`Expected ${orgDir} to be a directory`);
          return;
        }
        await uploadAppBlockTheme(
          join(blockThemeDir, 'index.css'),
          organizationId,
          appId,
          blockThemeStats.name.toLowerCase(),
        );
      });
    },
    { allowMissing: true },
  );
}
