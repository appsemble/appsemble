import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { basename, extname, join, relative, resolve as resolvePath } from 'node:path';
import { inspect } from 'node:util';

import {
  AppsembleError,
  getWorkspaces,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import { type BlockConfig, type BlockManifest } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import axios from 'axios';
import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import FormData from 'form-data';
import { type PackageJson } from 'type-fest';
// eslint-disable-next-line import/no-extraneous-dependencies
import webpack, { type Stats } from 'webpack';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript.js';
import { loadWebpackConfig } from './loadWebpackConfig.js';
import { processCss } from './processCss.js';

/**
 * Builds a block using Webpack.
 *
 * @param config The config of the block to build.
 * @returns The Webpack stats object.
 */
export async function buildBlock(config: BlockConfig): Promise<Stats> {
  const conf = await loadWebpackConfig(config, 'production', join(config.dir, config.output));

  if (existsSync(conf.output.path)) {
    logger.warn(`Removing ${conf.output.path}`);
    await rm(conf.output.path, { force: true, recursive: true });
  }
  logger.info(`Building ${config.name}@${config.version} 🔨`);

  const compiler = webpack(conf);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors()) {
        reject(new AppsembleError(stats.toString({ colors: true })));
      } else {
        logger.verbose(stats.toString({ colors: true }));
        resolve(stats);
      }
    });
  });
}

/**
 * Get the block configuration from a block directory.
 *
 * @param dir The directory in which to search for the configuration file.
 * @returns The block configuration.
 */
export async function getBlockConfig(dir: string): Promise<BlockConfig> {
  const explorer = cosmiconfig('appsemble', { stopDir: dir });
  const found = await explorer.search(dir);
  if (!found) {
    throw new AppsembleError(`No Appsemble configuration file found searching ${dir}`);
  }
  const { config, filepath } = found;
  logger.info(`Found configuration file: ${filepath}`);
  const [pkg] = await readData<PackageJson>(join(dir, 'package.json'));
  if (!pkg.private) {
    logger.warn(
      `It is ${chalk.underline.yellow('highly recommended')} to set “${chalk.green(
        '"private"',
      )}: ${chalk.cyan('true')}” in package.json`,
    );
  }
  let longDescription: string;
  if (existsSync(join(dir, 'README.md'))) {
    longDescription = await readFile(join(dir, 'README.md'), 'utf8');
  }

  const result = {
    description: pkg.description,
    longDescription,
    name: pkg.name,
    version: pkg.version,
    webpack: undefined,
    ...config,
    dir,
  };
  logger.verbose(`Resolved block configuration: ${inspect(result, { colors: true })}`);
  return result;
}

/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param root The project root in which to find workspaces.
 * @returns Discovered Appsemble blocks.
 */
export async function discoverBlocks(root: string): Promise<BlockConfig[]> {
  const dirs = await getWorkspaces(root);
  const manifests = await Promise.all(
    dirs
      .concat(root)
      .map((path) => getBlockConfig(path))
      // Ignore non-block workspaces.
      .map((p) => p.catch(() => null)),
  );
  return manifests.filter(Boolean);
}

/**
 * Configure the payload for a new block version upload.
 *
 * @param config The block configuration
 * @returns The payload that should be sent to the version endpoint.
 */
export async function makePayload(config: BlockConfig): Promise<[FormData, BlockManifest]> {
  const { dir, output } = config;
  const distPath = resolvePath(dir, output);
  const form = new FormData();
  const gatheredData: BlockManifest = {} as BlockManifest;
  const { description, layout, longDescription, name, version, visibility } = config;
  const { actions, events, messages, parameters } = getBlockConfigFromTypeScript(config);
  const files = await readdir(dir);
  const icon = files.find((entry) => entry.match(/^icon\.(png|svg)$/));

  function append(field: string, value: any): void {
    if (value) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      logger.verbose(`Using ${field}: ${inspect(value, { colors: true, depth: 20 })}`);
      form.append(field, serialized);
    } else {
      logger.silly(`Skipping parameter ${field}`);
    }
  }

  append('actions', actions);
  gatheredData.actions = actions;

  append('description', description);
  gatheredData.description = description;

  append('longDescription', longDescription);
  gatheredData.longDescription = longDescription;

  append('events', events);
  gatheredData.events = events;

  append('layout', layout);
  gatheredData.layout = layout;

  if (visibility) {
    append('visibility', visibility);
    gatheredData.visibility = visibility;
  }

  append('name', name);
  gatheredData.name = name;

  append('parameters', parameters);
  gatheredData.parameters = parameters;

  append('version', version);
  gatheredData.version = version;

  if (icon) {
    const iconPath = join(dir, icon);
    logger.info(`Using icon: ${iconPath}`);
    form.append('icon', createReadStream(iconPath));
    gatheredData.iconUrl = basename(iconPath, extname(iconPath));
  }

  if (messages) {
    if (!files.includes('i18n')) {
      throw new AppsembleError(
        'This block has messages defined, but the message files could not be found. Try running extract-messages',
      );
    }

    const messageKeys = Object.keys(messages).sort(compareStrings);
    const messagesResult: Record<string, Record<string, string>> = {};
    const messagesPath = join(dir, 'i18n');

    const translations = (await readdir(messagesPath)).map((language) => language.toLowerCase());
    if (!translations.includes('en.json')) {
      throw new AppsembleError('Could not find ‘en.json’. Try running extract-messages');
    }

    const duplicates = translations.filter(
      (language, index) => translations.indexOf(language) !== index,
    );

    if (duplicates.length) {
      throw new AppsembleError(`Found duplicate language codes: ‘${duplicates.join('’, ')}`);
    }

    for (const languageFile of translations.filter((t) => t.endsWith('.json'))) {
      const language = basename(languageFile, '.json');
      const languagePath = join(messagesPath, languageFile);
      const [m] = await readData<Record<string, string>>(languagePath);
      const languageKeys = Object.keys(m).sort(compareStrings);

      if (
        languageKeys.length !== messageKeys.length ||
        languageKeys.some((key) => !messageKeys.includes(key))
      ) {
        throw new AppsembleError(
          `‘${languagePath}’ contains mismatching message keys. Try running extract-messages`,
        );
      }

      logger.info(`Including ${language} translations from ‘${languagePath}’`);
      messagesResult[language] = m;
    }

    form.append('messages', JSON.stringify(messagesResult));
    gatheredData.messages = messagesResult;
  }

  if (files.includes('examples')) {
    await opendirSafe(
      join(dir, 'examples'),
      async (file, stat) => {
        if (!stat.isFile() || !file.endsWith('.yaml')) {
          throw new AppsembleError(`Expected ${file} to be a YAML file`);
        }
        logger.info(`Adding example file ${file}`);
        form.append('examples', await readFile(file, 'utf8'));
        gatheredData.examples = [...(gatheredData.examples || []), basename(file, extname(file))];
      },
      { allowMissing: true },
    );
  }

  await opendirSafe(
    distPath,
    (fullpath, stat) => {
      if (!stat.isFile()) {
        return;
      }
      const relativePath = relative(distPath, fullpath);
      const realPath = relative(process.cwd(), fullpath);
      logger.info(`Adding file: “${realPath}” as “${relativePath}”`);
      form.append('files', createReadStream(fullpath), {
        filename: encodeURIComponent(relativePath),
      });
      gatheredData.files = [...(gatheredData.files || []), relativePath];
    },
    { recursive: true },
  );

  return [form, gatheredData];
}

/**
 * Publish a new block version.
 *
 * @param config The block configuration
 * @param ignoreConflict Prevent the command from crashing when a conflict has been detected.
 */
export async function publishBlock(config: BlockConfig, ignoreConflict: boolean): Promise<void> {
  logger.info(`Publishing ${config.name}@${config.version}…`);
  const [form] = await makePayload(config);

  try {
    await axios.post('/api/blocks', form);
    logger.info(`Successfully published ${config.name}@${config.version} 🎉`);
  } catch (err: unknown) {
    if (ignoreConflict && axios.isAxiosError(err) && err.response.status === 409) {
      logger.warn(`${config.name}@${config.version} was already published.`);
      return;
    }
    throw err;
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

  await axios.post(
    `/api/apps/${appId}/style/block/${organization}/${block}`,
    { force, style },
    { baseURL: remote },
  );

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
  config: BlockConfig,
  languages: string[],
): Promise<void> {
  const path = join(config.dir, 'i18n');
  await mkdir(path, { recursive: true });
  const dir = await readdir(path);
  const { messages } = getBlockConfigFromTypeScript(config);

  if (!messages) {
    logger.warn(`Block ${config.name} has no messages.`);
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
  logger.info(`Finished extracting messages for ${config.name}.`);
  logger.info('');
}
