import { createReadStream, existsSync, promises as fs, ReadStream } from 'fs';
import { join, parse, resolve } from 'path';
import { URL } from 'url';
import { inspect } from 'util';

import { AppsembleError, logger, opendirSafe, readData, writeData } from '@appsemble/node-utils';
import { AppDefinition, AppsembleMessages, Messages } from '@appsemble/types';
import { extractAppMessages, has, normalizeBlockName } from '@appsemble/utils';
import axios from 'axios';
import FormData from 'form-data';
import { readdir } from 'fs-extra';

import { AppsembleContext, AppsembleRC } from '../types';
import { traverseBlockThemes } from './block';
import { processCss } from './processCss';
import { createResource } from './resource';

interface CreateAppParams {
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
   * Whether the App should be marked as private.
   */
  private: boolean;

  /**
   * The remote server to create the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template: boolean;

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
   * Whether resources from the `resources` directory should be created after creating the app.
   */
  resources: boolean;

  /**
   * If the app context is specified,
   * modify it for the current context to include the id of the created app.
   */
  modifyContext: boolean;
}
interface UpdateAppParams {
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
   * Whether the App should be marked as private.
   */
  private: boolean;

  /**
   * The remote server to create the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template: boolean;

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
}

/**
 * Traverses an app directory and appends the files it finds to the given FormData object.
 *
 * @param path - The path of the app directory to traverse.
 * @param context - The Context to use from `.appsemblerc.yaml`.
 * @param formData - The FormData object to append the results into..
 * @returns The context from `.appsemblerc.yaml` if a match was found.
 */
export async function traverseAppDirectory(
  path: string,
  context: string,
  formData: FormData,
): Promise<[AppsembleContext, AppsembleRC]> {
  let appFound: string;
  let discoveredContext: AppsembleContext;
  let rc: AppsembleRC;
  let iconPath: string;
  let maskableIconPath: string;

  logger.info(`Traversing directory for App files in ${path} 🕵`);
  await opendirSafe(path, async (filepath, stat) => {
    switch (stat.name.toLowerCase()) {
      case '.appsemblerc.yaml': {
        logger.info(`Reading app settings from ${filepath}`);
        [rc] = await readData<AppsembleRC>(filepath);
        if ('iconBackground' in rc) {
          formData.append('iconBackground', rc.iconBackground);
        }
        if (context && 'context' in rc && Object.hasOwnProperty.call(rc.context, context)) {
          discoveredContext = rc.context[context];
          logger.verbose(`Using context: ${inspect(discoveredContext, { colors: true })}`);
        }
        break;
      }

      case 'app-definition.yaml': {
        logger.info(`Using app definition from ${filepath}`);
        if (appFound) {
          throw new AppsembleError('Found duplicate app definition');
        }
        appFound = filepath;

        const [app, data] = await readData(filepath);
        formData.append('yaml', data);
        formData.append('definition', JSON.stringify(app));
        return;
      }

      case 'icon.png':
      case 'icon.svg':
        iconPath = filepath;
        return;

      case 'maskable-icon.png':
        maskableIconPath = filepath;
        return;

      case 'readme.md':
        logger.info(`Including longDescription from ${filepath}`);
        formData.append('longDescription', await fs.readFile(filepath, 'utf8'));
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
          formData.append(`${name}Style`, Buffer.from(css), `${name}.css`);
        });

      default:
        logger.warn(`Found unused file ${filepath}`);
    }
  });
  if (!appFound) {
    throw new AppsembleError('No app definition found');
  }
  discoveredContext ||= {};
  discoveredContext.icon = discoveredContext.icon
    ? resolve(path, discoveredContext.icon)
    : iconPath;
  discoveredContext.maskableIcon ||= maskableIconPath;
  return [discoveredContext, rc];
}

/**
 * Upload messages for an app.
 *
 * @param path - The path to the app directory.
 * @param appId - The app id to upload the messages for.
 * @param remote - The remote to upload the messages to.
 * @param force - Whether or not to force the update for locked apps.
 */
export async function uploadMessages(
  path: string,
  appId: string,
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
 * @param path - The path to the app directory.
 * @param languages - A list of languages for which translations should be added in addition to the
 * existing ones.
 * @param verify - A list of languages to verify.
 * @param format - The file format that should be used for the output.
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

  await opendirSafe(path, async (filepath, stat) => {
    switch (stat.name.toLowerCase()) {
      case 'app-definition.yaml': {
        [app] = await readData<AppDefinition>(filepath);
        break;
      }
      case 'i18n': {
        // For case insensitivity
        i18nDir = filepath;
        const i18nFiles = await fs.readdir(filepath);
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
  await fs.mkdir(i18nDir, { recursive: true });

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

    const coreMessages = oldMessages.core ?? {};
    for (const [key, value] of Object.entries(coreMessages)) {
      if (!value || typeof value !== 'string') {
        throw new AppsembleError(`Invalid translation key: core.${key}`);
      }
    }

    const blockMessages: AppsembleMessages['blocks'] = {};
    Object.keys(oldMessages.blocks ?? {}).forEach((key) => {
      if (!Object.keys(blockMessageKeys).includes(key)) {
        throw new AppsembleError(
          `Invalid translation key: blocks.${key}\nThis block is not used in the app`,
        );
      }
    });

    for (const [blockName] of Object.entries(blockMessageKeys)) {
      if (oldMessages.blocks?.[blockName]) {
        const currentVersionKeys = Object.keys(blockMessageKeys[blockName]);
        blockMessages[blockName] = {};

        for (const [version, oldValues] of Object.entries(oldMessages.blocks[blockName])) {
          if (!currentVersionKeys.includes(version)) {
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
 * Create a new App.
 *
 * @param argv - The command line options used for updating the app.
 */
export async function updateApp({
  context,
  force,
  path,
  ...options
}: UpdateAppParams): Promise<void> {
  const file = await fs.stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;

  if (file.isFile()) {
    const [app, data] = await readData(path);
    formData.append('yaml', data);
    formData.append('definition', JSON.stringify(app));
  } else {
    [appsembleContext] = await traverseAppDirectory(path, context, formData);
  }

  const remote = appsembleContext.remote ?? options.remote;
  const id = appsembleContext.id ?? options.id;
  const template = appsembleContext.template ?? options.template ?? false;
  const isPrivate = appsembleContext.private ?? options.private;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  logger.info(`App id: ${id}`);
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
  logger.verbose(`Icon background: ${iconBackground}`);
  logger.verbose(`Force update: ${inspect(force, { colors: true })}`);
  if (!id) {
    throw new AppsembleError('The app id must be passed as a command line flag or in the context');
  }
  formData.append('force', String(force));
  formData.append('template', String(template));
  formData.append('private', String(isPrivate));
  formData.append('iconBackground', iconBackground);
  if (icon) {
    const realIcon = typeof icon === 'string' ? createReadStream(icon) : icon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }
  if (maskableIcon) {
    const realIcon =
      typeof maskableIcon === 'string' ? createReadStream(maskableIcon) : maskableIcon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }

  const { data } = await axios.patch(`/api/apps/${id}`, formData, { baseURL: remote });

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
 * Create a new App.
 *
 * @param options - The options to use for creating an app.
 */
export async function createApp({
  context,
  dryRun,
  modifyContext,
  path,
  resources,
  ...options
}: CreateAppParams): Promise<void> {
  const file = await fs.stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;
  let rc: AppsembleRC;

  if (file.isFile()) {
    // Assuming file is App YAML
    const [app, data] = await readData(path);
    formData.append('yaml', data);
    formData.append('definition', JSON.stringify(app));
  } else {
    [appsembleContext, rc] = await traverseAppDirectory(path, context, formData);
  }

  const remote = appsembleContext.remote ?? options.remote;
  const organizationId = appsembleContext.organization ?? options.organization;
  const template = appsembleContext.template ?? options.template ?? false;
  const isPrivate = appsembleContext.private ?? options.private;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App organzation: ${organizationId}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
  logger.verbose(`Icon background: ${iconBackground}`);
  if (!organizationId) {
    throw new AppsembleError(
      'An organization id must be passed as a command line flag or in the context',
    );
  }
  formData.append('OrganizationId', organizationId);
  formData.append('template', String(template));
  formData.append('private', String(isPrivate));
  formData.append('iconBackground', iconBackground);
  if (icon) {
    const realIcon = typeof icon === 'string' ? createReadStream(icon) : icon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }
  if (maskableIcon) {
    const realIcon =
      typeof maskableIcon === 'string' ? createReadStream(maskableIcon) : maskableIcon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }

  const { data } = await axios.post('/api/apps', formData, { baseURL: remote, params: { dryRun } });

  if (dryRun) {
    logger.info('Skipped uploading block themes and app messages.');
    logger.info('Successfully ran dry run. The app should be valid when creating it.');
    return;
  }

  if (file.isDirectory() && !dryRun) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id, remote, false);
    await uploadMessages(path, data.id, remote, false);

    if (resources && existsSync(join(path, 'resources'))) {
      const resourcePath = join(path, 'resources');
      try {
        const resourceFiles = await fs.readdir(resourcePath, { withFileTypes: true });
        for (const resource of resourceFiles) {
          if (resource.isFile()) {
            const { name } = parse(resource.name);
            await createResource({
              appId: data.id,
              path: join(resourcePath, resource.name),
              remote,
              resourceName: name,
            });
          } else if (resource.isDirectory()) {
            const subDirectoryResources = await readdir(join(resourcePath, resource.name), {
              withFileTypes: true,
            });

            for (const subResource of subDirectoryResources.filter((s) => s.isFile())) {
              await createResource({
                appId: data.id,
                path: join(resourcePath, resource.name, subResource.name),
                remote,
                resourceName: resource.name,
              });
            }
          }
        }
      } catch (error: unknown) {
        logger.error('Something went wrong when creating resources:');
        logger.error(error);
      }
    }
  }

  if (modifyContext && appsembleContext && context && !dryRun) {
    await writeData(join(path, '.appsemblerc.yaml'), {
      ...rc,
      context: {
        ...rc.context,
        [context]: {
          ...rc.context[context],
          id: data.id,
        },
      },
    });

    logger.info(`Updated .appsemblerc: Set context.${context}.id to ${data.id}`);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully created app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}

/**
 * Helper function to normalize resolving the app’s ID and remote based on the app context.
 *
 * @param appPath - The path to the app.
 * @param context - Which context to use in the AppsembleRC file.
 * @param defaultRemote - The remote to fall back to.
 * @param defaultAppId - The app ID to fall back to.
 * @returns The resolved app ID and remote.
 */
export async function resolveAppIdAndRemote(
  appPath: string,
  context: string,
  defaultRemote: string,
  defaultAppId: number,
): Promise<[number, string]> {
  let id: number;
  let resolvedRemote = defaultRemote;

  if (appPath) {
    const [rc] = await readData<AppsembleRC>(join(appPath, '.appsemblerc.yaml'));
    if (rc.context?.[context]?.id) {
      id = Number(rc?.context?.[context]?.id);
    } else {
      throw new AppsembleError(
        `App ID was not found in ${join(appPath, '.appsemblerc.yaml')} context.${context}.id`,
      );
    }

    if (rc.context?.[context]?.remote) {
      resolvedRemote = rc.context?.[context]?.remote;
    }
  } else {
    id = defaultAppId;
  }

  return [id, resolvedRemote];
}
