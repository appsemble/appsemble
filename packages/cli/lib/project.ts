import { createReadStream } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve as resolvePath } from 'node:path';
import { inspect } from 'node:util';

import { AppsembleError, logger, opendirSafe, readData } from '@appsemble/node-utils';
import {
  type BlockManifest,
  type ProjectBuildConfig,
  type ProjectImplementations,
  type ProjectManifest,
} from '@appsemble/types';
import { compareStrings, normalizeLocale } from '@appsemble/utils';
import axios from 'axios';
import { build, type BuildOptions, type BuildResult } from 'esbuild';
import FormData from 'form-data';

import { getProjectImplementations } from './config.js';

export async function buildProject(config: ProjectBuildConfig): Promise<BuildResult> {
  const buildOptions: BuildOptions = {
    entryPoints: ['./src/index'],
    bundle: true,
    write: false,
    outdir: 'dist',
    absWorkingDir: join(config.dir),
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },
    logLevel: 'info',
    minify: true,
  };

  logger.info(`Building ${config.name}@${config.version} 🔨`);

  const buildResult = await build(buildOptions);

  if (buildResult.errors.length > 0) {
    throw new AppsembleError(String(buildResult.errors));
  }

  return buildResult;
}

/**
 * Configure the payload for a new project upload.
 *
 * @param buildConfig The project configuration
 * @returns The payload that should be sent to the endpoint.
 */
export async function makeProjectPayload(
  buildConfig: ProjectBuildConfig,
): Promise<[FormData, ProjectImplementations]> {
  const { dir, output } = buildConfig;
  const distPath = output ? resolvePath(dir, output) : undefined;

  const form = new FormData();

  const gatheredData = {} as BlockManifest;

  const {
    description,
    layout,
    longDescription,
    name,
    repositoryUrl,
    version,
    visibility,
    wildcardActions,
  } = buildConfig;

  const { actions, events, messages, parameters } = getProjectImplementations(buildConfig);

  const files = await readdir(dir);
  const icon = files.find((entry) => entry.match(/^icon\.(png|svg)$/));

  function append(field: keyof BlockManifest, value: any): void {
    if (value) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      logger.verbose(`Using ${field}: ${inspect(value, { colors: true, depth: 20 })}`);

      form.append(field as string, serialized);
      gatheredData[field as keyof ProjectManifest] = value;
    } else {
      logger.silly(`Skipping parameter ${field}`);
    }
  }

  if (visibility) {
    append('visibility', visibility);
  }

  append('actions', actions);
  append('description', description);
  append('longDescription', longDescription);
  append('repositoryUrl', repositoryUrl);
  append('events', events);
  append('layout', layout);
  append('name', name);
  append('parameters', parameters);
  append('version', version);
  append('wildcardActions', wildcardActions);

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

    const translationFiles = (await readdir(messagesPath)).filter((filename) =>
      filename.endsWith('.json'),
    );
    const translations = translationFiles.map((filename) =>
      normalizeLocale(basename(filename, '.json')),
    );
    if (!translations.includes('en')) {
      throw new AppsembleError('Could not find ‘en.json’. Try running extract-messages');
    }

    const duplicates = translations.filter(
      (language, index) => translations.indexOf(language) !== index,
    );

    if (duplicates.length) {
      throw new AppsembleError(`Found duplicate language codes: ‘${duplicates.join('’, ')}`);
    }

    for (const languageFile of translationFiles) {
      const language = normalizeLocale(basename(languageFile, '.json'));
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

  if (distPath) {
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
  }

  return [form, gatheredData];
}

export async function publishProject(
  buildConfig: ProjectBuildConfig,
  url: string,
  ignoreConflict?: boolean,
): Promise<void> {
  logger.info(`Publishing ${buildConfig.name}@${buildConfig.version}…`);
  const [form] = await makeProjectPayload(buildConfig);

  try {
    await axios.post(url, form);
    logger.info(`Successfully published ${buildConfig.name}@${buildConfig.version} 🎉`);
  } catch (err: unknown) {
    if (ignoreConflict && axios.isAxiosError(err) && err.response?.status === 409) {
      logger.warn(`${buildConfig.name}@${buildConfig.version} was already published.`);
      return;
    }
    throw err;
  }
}
