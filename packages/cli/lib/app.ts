import { createReadStream, createWriteStream, existsSync, type ReadStream } from 'node:fs';
import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, parse, relative, resolve } from 'node:path';
import { inspect } from 'node:util';

import {
  AppsembleError,
  authenticate,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import {
  type App,
  type AppDefinition,
  type AppsembleContext,
  type AppsembleMessages,
  type AppsembleRC,
  type AppVisibility,
  type Messages,
  type ProjectBuildConfig,
  type ProjectImplementations,
} from '@appsemble/types';
import { extractAppMessages, has, normalizeBlockName } from '@appsemble/utils';
import axios from 'axios';
import { type BuildResult } from 'esbuild';
import fg from 'fast-glob';
import FormData from 'form-data';
import normalizePath from 'normalize-path';
import { parse as parseYaml } from 'yaml';

import { publishAsset } from './asset.js';
import { traverseBlockThemes } from './block.js';
import { coerceRemote } from './coercers.js';
import { getProjectBuildConfig } from './config.js';
import { printAxiosError } from './output.js';
import { processCss } from './processCss.js';
import { buildProject, makeProjectPayload } from './project.js';
import { publishResourcesRecursively, type ResourceToPublish } from './resource.js';

interface PublishAppParams {
  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials?: string;

  /**
   * If specified, the context matching this name is used, overriding command line flags.
   */
  context?: string;

  /**
   * The ID of the organization to upload for.
   */
  organization: string;

  /**
   * The path in which the App YAML is located.
   */
  path: string;

  /**
   * Visibility of the app in the public app store.
   */
  visibility: AppVisibility;

  /**
   * The remote server to publish the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template: boolean;

  /**
   * Whether the App should be used in demo mode.
   */
  demoMode: boolean;

  /**
   * The icon to upload.
   */
  icon: NodeJS.ReadStream | ReadStream;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground: string;

  /**
   * The maskable icon to upload.
   */
  maskableIcon: NodeJS.ReadStream | ReadStream;

  /**
   * Whether the API should be called with a dry run.
   */
  dryRun: boolean;

  /**
   * Whether resources from the `resources` directory should be published after publishing the app.
   */
  resources: boolean;

  /**
   * Whether assets from the `assets` directory should be published after publishing the app.
   */
  assets: boolean;

  /**
   * Whether published assets should be clonable. Ignored if `assets` equals false.
   */
  assetsClonable: boolean;

  /**
   * If the app context is specified,
   * modify it for the current context to include the id of the published app.
   */
  modifyContext: boolean;

  /**
   * The ID to use for Google Analytics for the app.
   */
  googleAnalyticsId?: string;

  /**
   * The custom Sentry DSN for the app.
   */
  sentryDsn?: string;

  /**
   * The environment for the custom Sentry DSN for the app.
   */
  sentryEnvironment?: string;
}

interface UpdateAppParams {
  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials: string;

  /**
   * If specified, the context matching this name is used, overriding command line flags.
   */
  context?: string;

  /**
   * The ID of the app to update.
   */
  id?: number;

  /**
   * The path in which the App YAML is located.
   */
  path: string;

  /**
   * Visibility of the app in the public app store.
   */
  visibility: AppVisibility;

  /**
   * The remote server to create the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template: boolean;

  /**
   * Whether the App should be used in demo mode.
   */
  demoMode: boolean;

  /**
   * Whether the locked property should be ignored.
   */
  force: boolean;

  /**
   * The icon to upload.
   */
  icon: NodeJS.ReadStream | ReadStream;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground: string;

  /**
   * The maskable icon to upload.
   */
  maskableIcon: NodeJS.ReadStream | ReadStream;

  /**
   * The ID to use for Google Analytics for the app.
   */
  googleAnalyticsId?: string;

  /**
   * The custom Sentry DSN for the app.
   */
  sentryDsn?: string;

  /**
   * The environment for the custom Sentry DSN for the app.
   */
  sentryEnvironment?: string;
}

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param path The path of the app directory to traverse.
 * @param context The Context to use from `.appsemblerc.yaml`.
 * @param formData The FormData object to append the results into..
 * @returns The context from `.appsemblerc.yaml` if a match was found.
 */
export async function traverseAppDirectory(
  path: string,
  context: string,
  formData: FormData,
): Promise<[AppsembleContext, AppsembleRC, string, App]> {
  let discoveredContext: AppsembleContext;
  let rc: AppsembleRC;
  let iconPath: string;
  let maskableIconPath: string;
  let yaml: string;
  let controllerPath: string;
  let controllerBuildConfig: ProjectBuildConfig;
  let controllerBuildResult: BuildResult;
  let controllerCode: string;
  let controllerImplementations: ProjectImplementations;

  const gatheredData: App = {
    screenshotUrls: [],
  } as App;

  logger.info(`Traversing directory for App files in ${path} 🕵`);
  await opendirSafe(path, async (filepath, filestat) => {
    switch (filestat.name.toLowerCase()) {
      case '.appsemblerc.yaml':
        logger.info(`Reading app settings from ${filepath}`);
        [rc] = await readData<AppsembleRC>(filepath);
        if ('iconBackground' in rc) {
          formData.append('iconBackground', rc.iconBackground);
          gatheredData.iconBackground = rc.iconBackground;
        }
        if (context && has(rc?.context, context)) {
          discoveredContext = rc.context[context];
          logger.verbose(`Using context: ${inspect(discoveredContext, { colors: true })}`);
        }
        break;

      case 'app-definition.yaml': {
        logger.info(`Using app definition from ${filepath}`);
        if (yaml !== undefined) {
          throw new AppsembleError('Found duplicate app definition');
        }

        const [data, dataString] = await readData(filepath);
        yaml = dataString;
        formData.append('yaml', dataString);
        gatheredData.definition = data as AppDefinition;
        return;
      }

      case 'icon.png':
      case 'icon.svg':
        iconPath = filepath;
        gatheredData.iconUrl = filepath;
        return;

      case 'maskable-icon.png':
        maskableIconPath = filepath;
        return;

      case 'readme.md':
        logger.info(`Including longDescription from ${filepath}`);
        formData.append('longDescription', await readFile(filepath, 'utf8'));
        gatheredData.longDescription = await readFile(filepath, 'utf8');
        return;

      case 'screenshots':
        return opendirSafe(
          filepath,
          (screenshotPath, screenshotStat) => {
            logger.info(`Adding screenshot ${screenshotPath} 🖼️`);
            if (!screenshotStat.isFile()) {
              throw new AppsembleError(`Expected ${screenshotPath} to be an image file`);
            }
            formData.append('screenshots', createReadStream(screenshotPath));
            gatheredData.screenshotUrls.push(basename(screenshotPath));
          },
          { allowMissing: true },
        );

      case 'theme':
        return opendirSafe(filepath, async (themeDir, themeStat) => {
          const name = themeStat.name.toLowerCase();

          if (name !== 'core' && name !== 'shared') {
            return;
          }

          if (!themeStat.isDirectory()) {
            throw new AppsembleError(`Expected ${themeDir} to be a directory`);
          }

          const css = await processCss(join(themeDir, 'index.css'));

          formData.append(`${name}Style`, css);
          gatheredData[`${name}Style`] = css;
        });

      case 'controller':
        controllerPath = join(path, 'controller');
        controllerBuildConfig = await getProjectBuildConfig(controllerPath);
        controllerBuildResult = await buildProject(controllerBuildConfig);

        controllerCode = controllerBuildResult.outputFiles[0].text;

        formData.append('controllerCode', controllerCode);
        gatheredData.controllerCode = controllerCode;

        [, controllerImplementations] = await makeProjectPayload(controllerBuildConfig);

        formData.append('controllerImplementations', JSON.stringify(controllerImplementations));
        gatheredData.controllerImplementations = controllerImplementations;
        break;
      default:
        logger.warn(`Found unused file ${filepath}`);
    }
  });

  if (yaml === undefined) {
    throw new AppsembleError('No app definition found');
  }

  discoveredContext ||= {};
  discoveredContext.icon = discoveredContext.icon
    ? resolve(path, discoveredContext.icon)
    : iconPath;
  discoveredContext.maskableIcon = discoveredContext.maskableIcon
    ? resolve(path, discoveredContext.maskableIcon)
    : maskableIconPath;
  return [discoveredContext, rc, yaml, gatheredData];
}

/**
 * Export an app as a zip file.
 *
 * @param appId Id of the app to be exported.
 * @param resources Boolean representing whether to include resources in the zip file.
 * @param path Path of the folder where you want to put your downloaded file.
 * @param remote The remote to fetch the app from.
 */
export async function exportAppAsZip(
  appId: number,
  resources: boolean,
  path: string,
  remote: string,
): Promise<void> {
  const app = await axios.get(`/api/apps/${appId}`);
  const { name } = app.data.definition;
  const response = await axios.get(`/api/apps/${appId}/export?resources=${resources}`, {
    baseURL: remote,
    responseType: 'stream',
  });
  const zipFileName = join(path, `${name}_${appId}.zip`);
  const writeStream = createWriteStream(zipFileName);
  response.data.pipe(writeStream);
  logger.info(`Successfully downloaded file: ${zipFileName}`);
}

/**
 * Upload messages for an app.
 *
 * @param path The path to the app directory.
 * @param appId The app id to upload the messages for.
 * @param remote The remote to upload the messages to.
 * @param force Whether or not to force the update for locked apps.
 */
export async function uploadMessages(
  path: string,
  appId: number,
  remote: string,
  force: boolean,
): Promise<void> {
  const result: Messages[] = [];

  logger.info('Searching for translations 🕵');
  await opendirSafe(
    join(path, 'i18n'),
    async (messageFile) => {
      logger.verbose(`Processing ${messageFile} ⚙️`);
      const { name: language } = parse(messageFile);

      if (result.some((entry) => entry.language === language)) {
        throw new AppsembleError(
          `Found duplicate language “${language}”. Make sure each language only exists once in the directory.`,
        );
      }

      const [messages] = await readData<AppsembleMessages>(messageFile);
      result.push({ force, language, messages });
    },
    { allowMissing: true },
  );

  if (!result.length) {
    logger.info('No translations found 🤷');
  }

  for (const language of result) {
    await axios.post(`/api/apps/${appId}/messages`, language, { baseURL: remote });
    logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
  }
}

/**
 * @param path The path to the app directory.
 * @param languages A list of languages for which translations should be added in addition to the
 *   existing ones.
 * @param verify A list of languages to verify.
 * @param format The file format that should be used for the output.
 */
export async function writeAppMessages(
  path: string,
  languages: string[],
  verify: string[],
  format: 'json' | 'yaml',
): Promise<void> {
  logger.info(`Extracting messages from ${path}`);
  let app: AppDefinition;
  let i18nDir = join(path, 'i18n');
  const messageFiles = new Set<string>();

  await opendirSafe(path, async (filepath, filestat) => {
    switch (filestat.name.toLowerCase()) {
      case 'app-definition.yaml':
        [app] = await readData<AppDefinition>(filepath);
        break;
      case 'i18n': {
        // For case insensitivity
        i18nDir = filepath;
        const i18nFiles = await readdir(filepath);
        for (const f of i18nFiles) {
          messageFiles.add(join(filepath, f));
        }
        break;
      }
      default:
        break;
    }
  });
  if (!app) {
    throw new AppsembleError(`Couldn’t find app definition for ${path}`);
  }
  // Ensure the i18n directory exists.
  await mkdir(i18nDir, { recursive: true });

  for (const lang of [...languages, ...verify]) {
    messageFiles.add(join(i18nDir, `${lang}.${format}`));
  }
  const defaultLangFile = join(i18nDir, `${app.defaultLanguage || 'en'}.${format}`);
  messageFiles.add(defaultLangFile);
  const blockMessageKeys: AppsembleMessages['blocks'] = {};
  const extractedMessages = extractAppMessages(app, (block) => {
    const type = normalizeBlockName(block.type);
    if (blockMessageKeys[type]) {
      blockMessageKeys[type][block.version] = {};
    } else {
      blockMessageKeys[type] = {
        [block.version]: {},
      };
    }
  });
  logger.verbose(`Found message IDs: ${inspect(extractedMessages)}`);
  for (const filepath of messageFiles) {
    logger.info(`Processing ${filepath}`);
    let oldMessages: AppsembleMessages;
    if (existsSync(filepath)) {
      [oldMessages] = await readData<AppsembleMessages>(filepath);
    } else if (verify) {
      throw new AppsembleError(`Missing translations file: ${filepath}`);
    } else {
      oldMessages = {
        core: {},
        blocks: {},
        ...extractedMessages,
      };
    }

    const newMessageIds = Object.fromEntries(
      Object.keys(extractedMessages.messageIds).map((key) => {
        if (has(oldMessages.messageIds, key) && oldMessages.messageIds[key]) {
          if (typeof oldMessages.messageIds[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: messageIds.${key}`);
          }

          return [key, oldMessages.messageIds[key]];
        }

        if (verify.includes(parse(filepath).name)) {
          throw new AppsembleError(`Missing translation: messageIds.${key}`);
        }

        return [key, ''];
      }),
    );

    const newAppMessages = Object.fromEntries(
      Object.keys(extractedMessages.app).map((key) => {
        if (has(oldMessages.app, key) && oldMessages.app[key]) {
          if (typeof oldMessages.app[key] !== 'string') {
            throw new AppsembleError(`Invalid translation key: app.${key}`);
          }

          return [key, oldMessages.app[key]];
        }

        if (filepath === defaultLangFile) {
          return [key, extractedMessages.app[key]];
        }

        if (verify.includes(parse(filepath).name)) {
          throw new AppsembleError(`Missing translation: app.${key}`);
        }

        return [key, ''];
      }),
    );

    const appMessagePrefixes = Object.keys(newAppMessages);
    for (const [key, message] of Object.entries(oldMessages.app)) {
      const match = /^(pages\.\d+(\..+)?)\.blocks\.\d+.+/.exec(key);
      if (!match) {
        continue;
      }
      if (appMessagePrefixes.includes(match[1])) {
        newAppMessages[key] = message;
      }
    }

    const coreMessages = oldMessages.core ?? {};
    for (const [key, value] of Object.entries(coreMessages)) {
      if (!value || typeof value !== 'string') {
        throw new AppsembleError(`Invalid translation key: core.${key}`);
      }
    }

    const blockMessages: AppsembleMessages['blocks'] = {};
    if (oldMessages.blocks) {
      for (const key of Object.keys(oldMessages.blocks)) {
        if (!has(blockMessageKeys, key)) {
          throw new AppsembleError(
            `Invalid translation key: blocks.${key}\nThis block is not used in the app`,
          );
        }
      }
    }

    for (const [blockName] of Object.entries(blockMessageKeys)) {
      if (oldMessages.blocks?.[blockName]) {
        blockMessages[blockName] = {};

        for (const [version, oldValues] of Object.entries(oldMessages.blocks[blockName])) {
          if (!has(blockMessageKeys[blockName], version)) {
            throw new AppsembleError(
              `Invalid translation key: blocks.${blockName}.${version}
This block version is not used in the app`,
            );
          }

          for (const [oldValueKey, oldValue] of Object.entries(
            oldMessages.blocks[blockName][version],
          )) {
            if (typeof oldValue !== 'string') {
              throw new AppsembleError(
                `Invalid translation key: blocks.${blockName}.${version}.${oldValueKey}`,
              );
            }

            if (verify.includes(parse(filepath).name) && !oldValue) {
              throw new AppsembleError(
                `Missing translation: blocks.${blockName}.${version}.${oldValueKey}`,
              );
            }
          }

          blockMessages[blockName][version] = oldValues;
        }
      }
    }

    const result = {
      app: newAppMessages,
      ...(Object.keys(newMessageIds).length && { messageIds: newMessageIds }),
      ...(Object.keys(blockMessages).length && { blocks: blockMessages }),
      ...(Object.keys(coreMessages).length && { core: coreMessages }),
    };

    await writeData(filepath, result);
  }
}

/**
 * Update an existing app.
 *
 * @param argv The command line options used for updating the app.
 */
export async function updateApp({
  clientCredentials,
  context,
  force,
  path,
  ...options
}: UpdateAppParams): Promise<void> {
  const file = await stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;

  if (file.isFile()) {
    const [, data] = await readData(path);
    formData.append('yaml', data);
  } else {
    [appsembleContext] = await traverseAppDirectory(path, context, formData);
  }

  const remote = appsembleContext.remote ?? options.remote;
  const id = appsembleContext.id ?? options.id;
  const template = appsembleContext.template ?? options.template ?? false;
  const demoMode = appsembleContext.demoMode ?? options.demoMode ?? false;
  const visibility = appsembleContext.visibility ?? options.visibility;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  const sentryDsn = appsembleContext.sentryDsn ?? options.sentryDsn;
  const sentryEnvironment = appsembleContext.sentryEnvironment ?? options.sentryEnvironment;
  const googleAnalyticsId = appsembleContext.googleAnalyticsId ?? options.googleAnalyticsId;
  logger.info(`App id: ${id}`);
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App visibility: ${visibility}`);
  logger.verbose(`Icon background: ${iconBackground}`);
  logger.verbose(`Force update: ${inspect(force, { colors: true })}`);
  if (!id) {
    throw new AppsembleError('The app id must be passed as a command line flag or in the context');
  }
  formData.append('force', String(force));
  formData.append('template', String(template));
  formData.append('demoMode', String(demoMode));
  formData.append('visibility', visibility);
  formData.append('iconBackground', iconBackground);
  if (icon) {
    const realIcon = typeof icon === 'string' ? createReadStream(icon) : icon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }
  if (maskableIcon) {
    const realIcon =
      typeof maskableIcon === 'string' ? createReadStream(maskableIcon) : maskableIcon;
    logger.info(`Using maskable icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('maskableIcon', realIcon);
  }
  if (sentryDsn) {
    logger.info(
      `Using custom Sentry DSN ${sentryEnvironment ? `with environment ${sentryEnvironment}` : ''}`,
    );
    formData.append('sentryDsn', sentryDsn);
    if (sentryEnvironment) {
      formData.append('sentryEnvironment', sentryEnvironment);
    }
  }
  if (googleAnalyticsId) {
    logger.info('Using Google Analytics');
    formData.append('googleAnalyticsID', googleAnalyticsId);
  }

  await authenticate(remote, 'apps:write', clientCredentials);
  let data;
  try {
    data = await axios
      .patch<App>(`/api/apps/${id}`, formData, { baseURL: remote })
      .then((r) => r.data);
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if ((error.response?.data as { message?: string })?.message !== 'App validation failed') {
      throw error;
    }
    logger.error(error.response.data);
    process.exit(1);
  }

  if (file.isDirectory()) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id, remote, force);
    await uploadMessages(path, data.id, remote, force);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}

/**
 * Publish a new app.
 *
 * @param options The options to use for publishing an app.
 */
export async function publishApp({
  assets,
  assetsClonable,
  clientCredentials,
  context,
  dryRun,
  modifyContext,
  path,
  resources,
  ...options
}: PublishAppParams): Promise<void> {
  const file = await stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;
  let rc: AppsembleRC;
  let yaml: string;
  let filename = relative(process.cwd(), path);

  if (file.isFile()) {
    // Assuming file is App YAML
    const [, data] = await readData(path);
    yaml = data;
    formData.append('yaml', data);
  } else {
    [appsembleContext, rc, yaml] = await traverseAppDirectory(path, context, formData);
    filename = join(filename, 'app-definition.yaml');
  }
  const remote = appsembleContext.remote ?? options.remote;
  const organizationId = appsembleContext.organization ?? options.organization;
  const template = appsembleContext.template ?? options.template ?? false;
  const demoMode = appsembleContext.demoMode ?? options.demoMode ?? false;
  const visibility = appsembleContext.visibility ?? options.visibility;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  const sentryDsn = appsembleContext.sentryDsn ?? options.sentryDsn;
  const sentryEnvironment = appsembleContext.sentryEnvironment ?? options.sentryEnvironment;
  const googleAnalyticsId = appsembleContext.googleAnalyticsId ?? options.googleAnalyticsId;

  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App organization: ${organizationId}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App visibility: ${visibility}`);
  logger.verbose(`Icon background: ${iconBackground}`);

  if (!organizationId) {
    throw new AppsembleError(
      'An organization id must be passed as a command line flag or in the context',
    );
  }

  formData.append('OrganizationId', organizationId);
  formData.append('template', String(template));
  formData.append('demoMode', String(demoMode));
  formData.append('visibility', visibility);
  formData.append('iconBackground', iconBackground);

  if (icon) {
    const realIcon = typeof icon === 'string' ? createReadStream(icon) : icon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }

  if (maskableIcon) {
    const realIcon =
      typeof maskableIcon === 'string' ? createReadStream(maskableIcon) : maskableIcon;
    logger.info(`Using maskable icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('maskableIcon', realIcon);
  }

  if (sentryDsn) {
    logger.info(
      `Using custom Sentry DSN ${sentryEnvironment ? `with environment ${sentryEnvironment}` : ''}`,
    );
    formData.append('sentryDsn', sentryDsn);

    if (sentryEnvironment) {
      formData.append('sentryEnvironment', sentryEnvironment);
    }
  }

  if (googleAnalyticsId) {
    logger.info('Using Google Analytics');
    formData.append('googleAnalyticsID', googleAnalyticsId);
  }

  let authScope = 'apps:write';

  if (resources) {
    authScope += ' resources:write';
  }

  await authenticate(remote, authScope, clientCredentials);

  let data: App;
  try {
    ({ data } = await axios.post<App>('/api/apps', formData, {
      baseURL: remote,
      params: { dryRun: dryRun || undefined },
    }));
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if ((error.response?.data as { message?: string })?.message !== 'App validation failed') {
      throw error;
    }
    throw new AppsembleError(
      printAxiosError(filename, yaml, (error.response.data as any).data.errors),
    );
  }

  if (dryRun) {
    logger.info('Skipped uploading block themes and app messages.');
    logger.info('Successfully ran dry run. The app should be valid when creating it.');
    return;
  }

  if (file.isDirectory() && !dryRun) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id, remote, false);
    await uploadMessages(path, data.id, remote, false);

    if (assets && existsSync(join(path, 'assets'))) {
      const assetsPath = join(path, 'assets');
      const assetFiles = await readdir(assetsPath);
      const normalizedPaths = assetFiles.map((assetFile) =>
        normalizePath(join(assetsPath, assetFile)),
      );
      const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });
      try {
        logger.info(`Publishing ${files.length} asset(s)`);
        for (const assetFilePath of files) {
          await publishAsset({
            name: parse(assetFilePath).name,
            appId: data.id,
            path: assetFilePath,
            remote,
            clonable: assetsClonable,
          });
        }
      } catch (error: unknown) {
        logger.error('Something went wrong when creating assets:');
        logger.error(error);
      }
    }

    if (resources && existsSync(join(path, 'resources'))) {
      const appDefinition = parseYaml(yaml, { maxAliasCount: 10_000 }) as AppDefinition;
      const resourcePath = join(path, 'resources');
      try {
        const resourceFiles = await readdir(resourcePath, { withFileTypes: true });
        const resourcesToPublish: ResourceToPublish[] = [];
        const publishedResourcesIds: Record<string, number[]> = {};

        for (const resource of resourceFiles) {
          if (resource.isFile()) {
            const { name } = parse(resource.name);
            resourcesToPublish.push({
              appId: data.id,
              path: join(resourcePath, resource.name),
              definition: appDefinition.resources[name],
              type: name,
            });
          } else if (resource.isDirectory()) {
            const subDirectoryResources = await readdir(join(resourcePath, resource.name), {
              withFileTypes: true,
            });

            for (const subResource of subDirectoryResources.filter((s) => s.isFile())) {
              resourcesToPublish.push({
                appId: data.id,
                path: join(resourcePath, resource.name, subResource.name),
                definition: appDefinition.resources[resource.name],
                type: resource.name,
              });
            }
          }
        }

        await publishResourcesRecursively({
          remote,
          resourcesToPublish,
          publishedResourcesIds,
        });
      } catch (error: unknown) {
        logger.error('Something went wrong when creating resources:');
        logger.error(error);
      }
    }
  }

  if (modifyContext && appsembleContext && context && !dryRun) {
    rc.context[context].id = data.id;
    await writeData(join(path, '.appsemblerc.yaml'), rc, { sort: false });

    logger.info(`Updated .appsemblerc: Set context.${context}.id to ${data.id}`);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully published app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}

/**
 * Resolve the app’s ID and remote based on the app context.
 *
 * @param appPath The path to the app.
 * @param name Which context to use in the AppsembleRC file.
 * @param defaultRemote The remote to fall back to.
 * @param defaultAppId The app ID to fall back to.
 * @returns The resolved app ID and remote.
 */
export async function resolveAppIdAndRemote(
  appPath: string,
  name: string,
  defaultRemote: string,
  defaultAppId: number,
): Promise<[number, string]> {
  let id = defaultAppId;
  let resolvedRemote = defaultRemote;

  if (appPath) {
    const rcPath = join(appPath, '.appsemblerc.yaml');
    const [rc] = await readData<AppsembleRC>(rcPath);
    const context = rc.context?.[name];

    if (!defaultAppId) {
      id = context?.id;
    }

    if (context.remote) {
      resolvedRemote = context.remote;
    }
  }

  if (id == null) {
    throw new AppsembleError(`App ID was not found in context.${name}.id nor in --app-id`);
  }

  return [id, coerceRemote(resolvedRemote)];
}
