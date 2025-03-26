import { existsSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';

import {
  AppsembleError,
  authenticate,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import { type ProjectBuildConfig } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import axios from 'axios';
import webpack, { type Stats } from 'webpack';

import { getProjectImplementations, getProjectWebpackConfig } from './config.js';
import { processCss } from './processCss.js';

/**
 * Builds a block using Webpack.
 *
 * @param config The config of the block to build.
 * @returns The Webpack stats object.
 */

/**
 * Builds a block using Webpack.
 *
 * @param buildConfig The config of the block to build.
 * @returns The Webpack stats object.
 */

export async function buildBlock(
  buildConfig: ProjectBuildConfig,
  env?: 'development' | 'production',
): Promise<Stats> {
  const conf = await getProjectWebpackConfig(
    buildConfig,
    env || 'production',
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    join(buildConfig.dir, buildConfig.output),
  );

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  if (existsSync(conf.output?.path)) {
    logger.warn(`Removing ${conf.output?.path}`);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await rm(conf.output?.path, { force: true, recursive: true });
  }
  logger.info(`Building ${buildConfig.name}@${buildConfig.version} 🔨`);
  const compiler = webpack(conf);
  return new Promise((resolve, reject) => {
    const callback = (err: Error | null, stats: Stats | undefined): void => {
      if (err) {
        reject(err);
      } else if (stats?.hasErrors()) {
        reject(new AppsembleError(stats.toString({ colors: true })));
      } else {
        logger.verbose(stats?.toString({ colors: true }));
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        resolve(stats);
      }
    };

    if (env === 'development') {
      compiler.watch({ ignored: /node_modules/ }, callback);
    } else {
      compiler.run(callback);
    }
  });
}

interface DeleteBlockVersionParams {
  organization: string;
  blockName: string;
  blockVersion: string;
  remote: string;
  clientCredentials?: string;
}

export async function deleteBlock({
  blockName,
  blockVersion,
  clientCredentials,
  organization,
  remote,
}: DeleteBlockVersionParams): Promise<void> {
  try {
    await authenticate(remote, 'blocks:delete', clientCredentials);
    await axios.delete(`/api/blocks/@${organization}/${blockName}/versions/${blockVersion}`, {
      baseURL: remote,
    });
    logger.info(`Successfully deleted ${blockName} block version.`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Uploads an app block theme
 *
 * @param filePath The path of the index.css file
 * @param organization The ID of the organization the block belongs to.
 * @param appId The ID of the app to upload the theme for.
 * @param block The name of the block.
 * @param remote The HTTP origin to upload the theme to.
 * @param force Force update the theme if the app is locked.
 */
export async function uploadAppBlockTheme(
  filePath: string,
  organization: string,
  appId: number,
  block: string,
  remote: string,
  force: boolean,
): Promise<void> {
  logger.info(`Upload ${organization}/${block} stylesheet for app ${appId}`);

  const style = await processCss(filePath);

  try {
    await axios.post(
      `/api/apps/${appId}/style/block/${organization}/${block}`,
      { force, style },
      { baseURL: remote },
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }

  logger.info(`Upload of ${organization}/${block} stylesheet successful! 🎉`);
}

/**
 * Traverses the directory at a given path for app block themes and uploads them.
 *
 * @param path The path of the app.
 * @param appId The ID of the app.
 * @param remote The HTTP origin to upload the themes to.
 * @param force Force update the theme if the app is locked.
 */
export async function traverseBlockThemes(
  path: string,
  appId: number,
  remote: string,
  force: boolean,
): Promise<void> {
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
          remote,
          force,
        );
      });
    },
    { allowMissing: true },
  );
}

export async function processBlockMessages(
  buildConfig: ProjectBuildConfig,
  languages: string[],
): Promise<void> {
  const path = join(buildConfig.dir, 'i18n');
  await mkdir(path, { recursive: true });
  const dir = await readdir(path);
  const { messages } = getProjectImplementations(buildConfig);

  if (!messages) {
    logger.warn(`Block ${buildConfig.name} has no messages.`);
    return;
  }

  const keys = Object.keys(messages).sort(compareStrings);
  const base = Object.fromEntries(keys.map((key) => [key, '']));

  const existingLanguages = dir
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => basename(filename, '.json'));
  for (const language of new Set([...languages, ...existingLanguages])) {
    const existingMessages = { ...base };
    const name = `${language}.json`;
    const langPath = join(path, name);

    if (dir.includes(name)) {
      const [m] = await readData<Record<string, string>>(langPath);
      Object.assign(existingMessages, m);
    }

    const extraKeys = Object.keys(existingMessages).filter((key) => !keys.includes(key));
    if (extraKeys.length) {
      logger.info(`Found ${extraKeys.length} keys too many. Removing: ${extraKeys.join(', ')}`);
      for (const key of extraKeys) {
        delete existingMessages[key];
      }
    }

    await writeData(langPath, existingMessages);
    logger.info(`Wrote to file ‘${langPath}’`);
  }
  logger.info(`Finished extracting messages for ${buildConfig.name}.`);
  logger.info('');
}
