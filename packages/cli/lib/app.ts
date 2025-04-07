import { cpSync, createReadStream, createWriteStream, existsSync, type ReadStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { basename, dirname, join, parse, relative, resolve } from 'node:path';
import { inspect } from 'node:util';

import { extractAppMessages, has, normalizeBlockName } from '@appsemble/lang-sdk';
import {
  applyAppVariant,
  AppsembleError,
  authenticate,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import {
  type App,
  type AppConfigEntryDefinition,
  type AppDefinition,
  type AppLock,
  type AppOAuth2Secret,
  type AppsembleContext,
  type AppsembleMessages,
  type AppsembleRC,
  type AppServiceSecretDefinition,
  type AppVisibility,
  type Messages,
  type ProjectBuildConfig,
  type ProjectImplementations,
  type ValueFromDefinition,
  type ValueFromProcess,
  type WritableAppSamlSecret,
} from '@appsemble/types';
import axios from 'axios';
import { type BuildResult } from 'esbuild';
import fg from 'fast-glob';
import FormData from 'form-data';
import normalizePath from 'normalize-path';

import { publishAsset } from './asset.js';
import { traverseBlockThemes } from './block.js';
import { coerceRemote } from './coercers.js';
import { getProjectBuildConfig } from './config.js';
import { printAxiosError } from './output.js';
import { processCss } from './processCss.js';
import { buildProject, makeProjectPayload } from './project.js';
import { publishResourcesRecursively, type ResourceToPublish } from './resource.js';

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
  let rc: AppsembleRC;
  let discoveredContext: AppsembleContext;
  let yaml: string;
  let iconPath: string;
  let maskableIconPath: string;
  let controllerPath: string;
  let controllerBuildConfig: ProjectBuildConfig;
  let controllerBuildResult: BuildResult;
  let controllerCode: string;
  let controllerImplementations: ProjectImplementations;

  let supportedLanguages = new Set();
  try {
    const languageFiles = await readdir(join(path, 'i18n'));
    supportedLanguages = new Set(languageFiles.map((lang) => lang.split('.json')[0].toLowerCase()));
  } catch {
    logger.warn(`Could not read ${join(path, 'i18n')}. No supported languages found.`);
  }

  const gatheredData: Partial<App> & { screenshotUrls: string[] } = {
    screenshotUrls: [],
  };

  logger.info(`Traversing directory for App files in ${path} 🕵`);
  await opendirSafe(path, async (filepath, filestat) => {
    if (filestat.isFile() && filestat.name.toLowerCase().startsWith('readme')) {
      logger.info(`Adding ${filepath}`);
      formData.append('readmes', createReadStream(filepath));

      if (filestat.name.toLowerCase().startsWith('readme.md')) {
        gatheredData.readmeUrl = basename(filepath);
      }
      return;
    }

    switch (filestat.name.toLowerCase()) {
      case '.appsemblerc.yaml':
        logger.info(`Reading app settings from ${filepath}`);
        [rc] = await readData<AppsembleRC>(filepath);
        if ('iconBackground' in rc) {
          formData.append('iconBackground', rc.iconBackground);
          gatheredData.iconBackground = rc.iconBackground;
        }
        if (context && has(rc?.context, context)) {
          discoveredContext = rc.context![context];
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
        break;

      case 'screenshots':
        return opendirSafe(
          filepath,
          (screenshotPath, screenshotStat) => {
            if (
              screenshotStat.isDirectory() &&
              !['screenshots', ...supportedLanguages].includes(screenshotStat.name)
            ) {
              logger.warn(`Unsupported directory name at ${screenshotPath}. Skipping...`);
            }

            if (screenshotStat.isFile()) {
              const screenshotDirectoryPath = dirname(screenshotPath);
              const screenshotDirectoryName = basename(screenshotDirectoryPath);

              if (!['screenshots', ...supportedLanguages].includes(screenshotDirectoryName)) {
                return;
              }

              const screenshotName = basename(screenshotPath);
              const language = supportedLanguages.has(screenshotDirectoryName)
                ? screenshotDirectoryName
                : 'unspecified';

              const tmpFilePath = join(screenshotDirectoryPath, `${language}-${screenshotName}`);

              cpSync(screenshotPath, tmpFilePath);

              logger.info(`Adding screenshot ${tmpFilePath} 🖼️`);
              formData.append('screenshots', createReadStream(tmpFilePath));
              gatheredData.screenshotUrls.push(basename(screenshotPath));

              rm(tmpFilePath);
            }
          },
          { allowMissing: true, recursive: true },
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

        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        controllerCode = controllerBuildResult.outputFiles?.[0].text;

        formData.append('controllerCode', controllerCode);
        gatheredData.controllerCode = controllerCode;

        [, controllerImplementations] = await makeProjectPayload(controllerBuildConfig);

        formData.append('controllerImplementations', JSON.stringify(controllerImplementations));
        gatheredData.controllerImplementations = controllerImplementations;
        break;

      default:
        break;
    }
  });

  // @ts-expect-error 2454 Variable used before it was assigned
  if (yaml === undefined) {
    throw new AppsembleError('No app definition found');
  }
  discoveredContext ||= {};
  // @ts-expect-error 2454 Variable used before it was assigned
  // eslint-disable-next-line prettier/prettier
  discoveredContext.icon = discoveredContext.icon ? resolve(path, discoveredContext.icon) : iconPath;
  // @ts-expect-error 2454 Variable used before it was assigned
  // eslint-disable-next-line prettier/prettier
  discoveredContext.maskableIcon = discoveredContext.maskableIcon ? resolve(path, discoveredContext.maskableIcon) : maskableIconPath;

  // @ts-expect-error 2454 Variable used before it was assigned
  return [discoveredContext, rc, yaml, gatheredData as App];
}

function extractFilenameFromContentDisposition(contentDisposition: string): string | null {
  const match = contentDisposition.match(/filename="(.+?)"/);
  if (match && match.length > 1) {
    return match[1];
  }
  return null;
}

async function retrieveContext(path: string, context: string): Promise<AppsembleContext> {
  let rc: AppsembleRC;
  let discoveredContext: AppsembleContext;
  let iconPath: string;
  let maskableIconPath: string;
  await opendirSafe(path, async (filepath, filestat) => {
    switch (filestat.name.toLowerCase()) {
      case '.appsemblerc.yaml':
        logger.info(`Reading app settings from ${filepath}`);
        [rc] = await readData<AppsembleRC>(filepath);
        if (context && has(rc?.context, context)) {
          discoveredContext = rc.context![context];
          logger.verbose(`Using context: ${inspect(discoveredContext, { colors: true })}`);
        }
        break;
      case 'icon.png':
      case 'icon.svg':
        iconPath = filepath;
        return;

      case 'maskable-icon.png':
        maskableIconPath = filepath;
        break;
      default:
        break;
    }
  });
  discoveredContext ||= {};
  // @ts-expect-error 2454 Variable used before it was assigned
  // eslint-disable-next-line prettier/prettier
  discoveredContext.icon = discoveredContext.icon ? resolve(path, discoveredContext.icon) : iconPath;
  // @ts-expect-error 2454 Variable used before it was assigned
  // eslint-disable-next-line prettier/prettier
  discoveredContext.maskableIcon = discoveredContext.maskableIcon ? resolve(path, discoveredContext.maskableIcon) : maskableIconPath;

  return discoveredContext;
}

/**
 * Export an app as a zip file.
 *
 * @param clientCredentials The OAuth2 client credentials to use
 * @param appId Id of the app to be exported.
 * @param assets Boolean representing whether to include assets in the exported zip file.
 * @param resources Boolean representing whether to include resources in the zip file.
 * @param path Path of the folder where you want to put your downloaded file.
 * @param remote The remote to fetch the app from.
 */
export async function exportAppAsZip(
  clientCredentials: string,
  appId: number,
  assets: boolean,
  resources: boolean,
  path: string,
  remote: string,
): Promise<void> {
  await authenticate(remote, 'apps:export', clientCredentials);
  try {
    const response = await axios.get(
      `/api/apps/${appId}/export?resources=${resources}&assets=${assets}`,
      {
        baseURL: remote,
        responseType: 'stream',
      },
    );
    const zipFileName = join(
      path,
      String(extractFilenameFromContentDisposition(response.headers['content-disposition'])),
    );
    const writeStream = createWriteStream(zipFileName);
    response.data.pipe(writeStream);
    logger.info(`Successfully downloaded file: ${zipFileName}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
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

  try {
    for (const language of result) {
      await axios.post(`/api/apps/${appId}/messages`, language, { baseURL: remote });
      logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

interface DeleteAppArgs {
  remote: string;
  id: number;
  clientCredentials: string;
}

export async function deleteApp({ clientCredentials, id, remote }: DeleteAppArgs): Promise<void> {
  await authenticate(remote, 'apps:delete', clientCredentials);
  try {
    const response = await axios.get(`/api/apps/${id}`);
    const { name } = response.data;
    logger.warn(`Deleting app: ${name}`);
    await axios.delete(`/api/apps/${id}`, {
      baseURL: remote,
    });
    logger.info(`Successfully deleted app with id ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function publishSeedResources(path: string, app: App, remote: string): Promise<void> {
  const resourcesPath = join(path, 'resources');
  logger.info(`Publishing seed resources from ${resourcesPath}`);

  if (existsSync(resourcesPath)) {
    logger.info(`Deleting existing seed resources from app ${app.id}`);

    try {
      await axios.delete(`/api/apps/${app.id}/resources`, { baseURL: remote });

      const resourceFiles = await readdir(resourcesPath, { withFileTypes: true });
      const resourcesToPublish: ResourceToPublish[] = [];
      const publishedResourcesIds: Record<string, number[]> = {};

      for (const resource of resourceFiles) {
        if (resource.isFile()) {
          const { name } = parse(resource.name);
          resourcesToPublish.push({
            // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
            appId: app.id,
            path: join(resourcesPath, resource.name),
            // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
            definition: app.definition.resources?.[name],
            type: name,
          });
        } else if (resource.isDirectory()) {
          const subDirectoryResources = await readdir(join(resourcesPath, resource.name), {
            withFileTypes: true,
          });

          for (const subResource of subDirectoryResources.filter((s) => s.isFile())) {
            resourcesToPublish.push({
              // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
              appId: app.id,
              path: join(resourcesPath, resource.name, subResource.name),
              // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
              definition: app.definition.resources?.[resource.name],
              type: resource.name,
            });
          }
        }
      }

      await publishResourcesRecursively({
        seed: true,
        remote,
        resourcesToPublish,
        publishedResourcesIds,
      });
    } catch (error: unknown) {
      logger.error('Something went wrong when publishing seed resources:');
      logger.error(error);
    }
  } else {
    logger.warn(`Missing resources directory in ${path}. Skipping...`);
  }
}

export async function publishSeedAssets(
  path: string,
  app: App,
  remote: string,
  assetsClonable: boolean,
): Promise<void> {
  const assetsPath = join(path, 'assets');
  logger.info(`Publishing seed assets from ${assetsPath}`);

  if (existsSync(assetsPath)) {
    logger.info(`Deleting existing seed assets from app ${app.id}`);

    try {
      await axios.delete(`/api/apps/${app.id}/assets`, {
        data: [],
        baseURL: remote,
        params: { seed: true },
      });

      const assetFiles = await readdir(assetsPath);
      const normalizedPaths = assetFiles.map((assetFile) =>
        normalizePath(join(assetsPath, assetFile)),
      );
      const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

      logger.info(`Publishing ${files.length} asset(s)`);
      for (const assetFilePath of files) {
        await publishAsset({
          name: parse(assetFilePath).name,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          appId: app.id,
          path: assetFilePath,
          remote,
          seed: true,
          clonable: assetsClonable,
        });
      }
    } catch (error: unknown) {
      logger.error('Something went wrong when creating assets:');
      logger.error(error);
    }
  } else {
    logger.warn(`Missing assets directory in ${path}. Skipping...`);
  }
}

function parseValueFromDefinition(value: ValueFromDefinition): ValueFromProcess {
  let parsed = value;

  if (typeof parsed === 'string' && parsed.includes('{{') && parsed.includes('}}')) {
    parsed = parsed.replaceAll(
      /{{\s*([^\s{}]+)\s*}}/g,
      (match, variable) => process.env[variable.trim()] || match,
    );
  }

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return parsed;
}

export function parseValues(
  type: string,
  name: string,
  valuesToParse: Record<string, ValueFromDefinition>[],
): [Record<string, ValueFromProcess>, boolean] {
  const parsedValues: Record<string, ValueFromProcess> = {};
  let missingValues = false;

  for (const valueToParse of valuesToParse) {
    const [key, value] = Object.entries(valueToParse)[0];

    parsedValues[key] = parseValueFromDefinition(value);

    if (!parsedValues[key]) {
      logger.error(`Missing ${key} value for ${type} ${name}`);
      missingValues = true;
    }
  }
  return [parsedValues, missingValues];
}

export async function publishAppConfig(path: string, app: App, remote: string): Promise<void> {
  const configPath = join(path, 'config');
  logger.info(`Publishing app config from ${configPath}`);

  if (existsSync(configPath)) {
    try {
      logger.info(`Deleting existing variables from app ${app.id}`);
      await axios.delete(`/api/apps/${app.id}/variables`, { baseURL: remote });

      const appVariablesPath = join(configPath, 'variables.json');
      if (existsSync(appVariablesPath)) {
        const [appVariables] = (await readData(appVariablesPath)) as [
          AppConfigEntryDefinition[],
          string,
        ];

        if (appVariables.length) {
          logger.info(`Publishing ${appVariables.length} app variable(s)`);
          for (const appVariable of appVariables) {
            const { name, value } = appVariable;

            const [parsedValues, missingValues] = parseValues('variable', name, [{ value }]);

            if (missingValues) {
              continue;
            }

            await axios.post(
              `/api/apps/${app.id}/variables`,
              { name, ...parsedValues },
              { baseURL: remote },
            );
          }
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app variables:');
      logger.error(error);
    }

    try {
      logger.info(`Deleting existing service secrets from app ${app.id}`);
      await axios.delete(`/api/apps/${app.id}/secrets/service`, { baseURL: remote });

      const serviceSecretsPath = join(configPath, 'secrets', 'service.json');
      if (existsSync(serviceSecretsPath)) {
        const [serviceSecrets] = (await readData(serviceSecretsPath)) as [
          AppServiceSecretDefinition[],
          string,
        ];

        if (serviceSecrets.length) {
          logger.info(`Publishing ${serviceSecrets.length} app service secret(s)`);

          for (const serviceSecret of serviceSecrets) {
            const { identifier, name, secret, urlPatterns, ...rest } = serviceSecret;

            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks)
            const [parsedValues, missingValues] = parseValues('service secret', name, [
              { secret },
              { identifier },
              { urlPatterns },
            ]);

            if (missingValues) {
              continue;
            }

            await axios.post(
              `/api/apps/${app.id}/secrets/service`,
              { name, ...parsedValues, ...rest },
              { baseURL: remote },
            );
          }
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app service secrets:');
      logger.error(error);
    }

    try {
      logger.info(`Deleting existing saml secrets from app ${app.id}`);
      await axios.delete(`/api/apps/${app.id}/secrets/saml`, { baseURL: remote });

      const samlSecretsPath = join(configPath, 'secrets', 'saml.json');
      if (existsSync(samlSecretsPath)) {
        const [samlSecrets] = (await readData(samlSecretsPath)) as [
          WritableAppSamlSecret[],
          string,
        ];

        if (samlSecrets.length) {
          logger.info(`Publishing ${samlSecrets.length} app saml secret(s)`);

          for (const samlSecret of samlSecrets) {
            const { entityId, idpCertificate, name, ssoUrl, ...rest } = samlSecret;

            const [parsedValues, missingValues] = parseValues('saml secret', name, [
              { entityId },
              { idpCertificate },
              { ssoUrl },
            ]);

            if (missingValues) {
              continue;
            }

            await axios.post(
              `/api/apps/${app.id}/secrets/saml`,
              { name, ...parsedValues, ...rest },
              { baseURL: remote },
            );
          }
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app saml secrets:');
      logger.error(error);
    }

    try {
      logger.info(`Deleting existing oauth2 secrets from app ${app.id}`);
      await axios.delete(`/api/apps/${app.id}/secrets/oauth2`, { baseURL: remote });

      const oauth2SecretsPath = join(configPath, 'secrets', 'oauth2.json');
      if (existsSync(oauth2SecretsPath)) {
        const [oauth2Secrets] = (await readData(oauth2SecretsPath)) as [AppOAuth2Secret[], string];

        if (oauth2Secrets.length) {
          logger.info(`Publishing ${oauth2Secrets.length} app oauth2 secrets`);

          for (const oauth2Secret of oauth2Secrets) {
            const {
              authorizationUrl,
              clientId,
              clientSecret,
              name,
              tokenUrl,
              userInfoUrl,
              ...rest
            } = oauth2Secret;

            const [parsedValues, missingValues] = parseValues('oauth2 secret', name, [
              { authorizationUrl },
              { tokenUrl },
              { userInfoUrl },
              { clientId },
              { clientSecret },
            ]);

            if (missingValues) {
              continue;
            }

            await axios.post(
              `/api/apps/${app.id}/secrets/oauth2`,
              { name, ...parsedValues, ...rest },
              { baseURL: remote },
            );
          }
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app oauth2 secrets:');
      logger.error(error);
    }

    try {
      const sslSecretPath = join(configPath, 'secrets', 'ssl.json');
      if (existsSync(sslSecretPath)) {
        const [sslSecret] = (await readData(sslSecretPath)) as [
          { certificate: string; key: string },
          string,
        ];

        if (sslSecret) {
          logger.info('Publishing app ssl secret');

          const { certificate, key } = sslSecret;

          const [parsedValues, missingValues] = parseValues('ssl secret', '', [
            { certificate },
            { key },
          ]);

          if (missingValues) {
            return;
          }

          await axios.put(
            `/api/apps/${app.id}/secrets/ssl`,
            { ...parsedValues },
            { baseURL: remote },
          );
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app ssl secret:');
      logger.error(error);
    }

    try {
      const scimSecretPath = join(configPath, 'secrets', 'scim.json');
      if (existsSync(scimSecretPath)) {
        const [scimSecret] = (await readData(scimSecretPath)) as [
          { enabled: boolean; token: string },
          string,
        ];

        if (scimSecret) {
          logger.info('Publishing app scim secret');

          const { enabled, token } = scimSecret;

          const [parsedValues, missingValues] = parseValues('scim secret', '', [{ token }]);

          if (missingValues) {
            return;
          }

          await axios.patch(
            `/api/apps/${app.id}/secrets/scim`,
            { enabled, ...parsedValues },
            { baseURL: remote },
          );
        }
      }
    } catch (error) {
      logger.error('Something went wrong when creating app scim secret:');
      logger.error(error);
    }
  } else {
    logger.warn(`Missing config directory in ${path}. Skipping...`);
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
  let app: AppDefinition | undefined;
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
    const unusedMessages = Object.fromEntries(
      Object.entries(oldMessages.messageIds ?? {}).filter(
        ([key, value]) => !Object.hasOwn(newMessageIds, key) && value !== '',
      ),
    );
    Object.assign(newMessageIds, unusedMessages);

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
    for (const [key, message] of Object.entries(oldMessages.app ?? {})) {
      const match = /^(pages\.[\dA-Za-z-]+(\..+)?)\.blocks\.\d+.+/.exec(key);
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

    if (context?.id) {
      id = context?.id;
    }

    if (context?.remote) {
      resolvedRemote = context.remote;
    }
  }

  if (id == null) {
    throw new AppsembleError(`App ID was not found in context.${name}.id nor in --app-id`);
  }

  if (resolvedRemote == null) {
    throw new AppsembleError(`App remote was not found in context.${name}.remote nor in --remote`);
  }

  return [id, coerceRemote(resolvedRemote)];
}

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
   * The shared variant to use instead.
   */
  variant?: string;

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
  template?: boolean;

  /**
   * Whether the App should be used in demo mode.
   */
  demoMode?: boolean;

  /**
   * The icon to upload.
   */
  icon?: NodeJS.ReadStream | ReadStream;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground: string;

  /**
   * The maskable icon to upload.
   */
  maskableIcon?: NodeJS.ReadStream | ReadStream;

  /**
   * Whether the API should be called with a dry run.
   */
  dryRun?: boolean;

  /**
   * Whether resources from the `resources` directory should be published after publishing the app.
   */
  resources?: boolean;

  /**
   * Whether assets from the `assets` directory should be published after publishing the app.
   */
  assets?: boolean;

  /**
   * Whether published assets should be clonable. Ignored if `assets` equals false.
   */
  assetsClonable?: boolean;

  /**
   * If the app context is specified,
   * modify it for the current context to include the id of the published app.
   */
  modifyContext?: boolean;

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
 * Publish a new app.
 *
 * @param options The options to use for publishing an app.
 */
export async function publishApp({
  clientCredentials,
  context,
  dryRun,
  modifyContext,
  path,
  ...options
}: PublishAppParams): Promise<void> {
  const file = await stat(path);
  const formData = new FormData();
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const appsembleContext = await retrieveContext(path, context);
  let rc: AppsembleRC;
  let yaml: string;
  let filename = relative(process.cwd(), path);

  const variant = appsembleContext.variant ?? options.variant ?? context;

  let appVariantPath = path;
  if (variant && existsSync(join(path, 'variants', variant))) {
    await applyAppVariant(path, variant);
    appVariantPath = join(dirname(path), `${basename(path)}-${variant}`);
  } else {
    logger.warn(
      `App variant ${variant} is not defined in ${join(path, 'variants')}. Using default app.`,
    );
  }

  if (file.isFile()) {
    // Assuming file is App YAML
    const [, data] = await readData(appVariantPath);
    yaml = data;
    formData.append('yaml', data);
  } else {
    let appsembleVariantContext;
    [appsembleVariantContext, rc, yaml] = await traverseAppDirectory(
      appVariantPath,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      context,
      formData,
    );
    if (appsembleVariantContext.icon) {
      appsembleContext.icon = appsembleVariantContext.icon;
    }
    if (appsembleVariantContext.maskableIcon) {
      appsembleContext.maskableIcon = appsembleVariantContext.maskableIcon;
    }
    filename = join(filename, 'app-definition.yaml');
  }

  const remote = appsembleContext.remote ?? options.remote;
  const organizationId = appsembleContext.organization ?? options.organization;
  const template = appsembleContext.template ?? options.template ?? false;
  const assetsClonable = appsembleContext.assetsClonable ?? options.assetsClonable ?? false;
  const demoMode = appsembleContext.demoMode ?? options.demoMode ?? false;
  const visibility = appsembleContext.visibility ?? options.visibility;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  const sentryDsn = appsembleContext.sentryDsn ?? options.sentryDsn;
  const sentryEnvironment = appsembleContext.sentryEnvironment ?? options.sentryEnvironment;
  const googleAnalyticsId = appsembleContext.googleAnalyticsId ?? options.googleAnalyticsId;
  const assets = appsembleContext.assets ?? options.assets;
  const resources = appsembleContext.resources ?? options.resources;
  const appLock = appsembleContext.appLock || 'unlocked';

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
  formData.append('locked', appLock);

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

  if (assets) {
    authScope += ' assets:write';
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
      printAxiosError(filename, yaml, (error.response?.data as any).data.errors),
    );
  }

  if (dryRun) {
    logger.info('Skipped uploading block themes and app messages.');
    logger.info('Successfully ran dry run. The app should be valid when creating it.');
    return;
  }

  if (file.isDirectory() && !dryRun) {
    // After uploading the app, upload block styles, messages if they are available
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await traverseBlockThemes(appVariantPath, data.id, remote, false);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await uploadMessages(appVariantPath, data.id, remote, false);
    await publishAppConfig(appVariantPath, data, remote);

    // After uploading the app, publish seed resources and assets if they are available
    if (assets) {
      await publishSeedAssets(appVariantPath, data, remote, assetsClonable);
    }

    if (resources) {
      await publishSeedResources(appVariantPath, data, remote);
    }
  }

  if (modifyContext && appsembleContext && context && !dryRun) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    rc.context[context].id = data.id;
    // @ts-expect-error 2454 Variable used before it was assigned
    await writeData(join(appVariantPath, '.appsemblerc.yaml'), rc, { sort: false });

    logger.info(`Updated .appsemblerc: Set context.${context}.id to ${data.id}`);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully published app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);

  // eslint-disable-next-line max-len
  // @ts-expect-error 2454 Variable used before it was assigned, 2538 Undefined cannot be used as an index type
  const rcCollections = rc?.context?.[context]?.collections;
  if (Array.isArray(rcCollections)) {
    for (const collectionId of rcCollections) {
      try {
        await axios.post<App>(
          `/api/app-collections/${collectionId}/apps`,
          { AppId: data.id },
          {
            baseURL: remote,
          },
        );
        logger.info(`Successfully added app to collection ${collectionId}`);
      } catch (error) {
        logger.error(error);
      }
    }
  }

  if (appVariantPath !== path && modifyContext && !dryRun) {
    const [defaultAppRc] = await readData<AppsembleRC>(join(path, '.appsemblerc.yaml'));
    // @ts-expect-error 2538 Undefined cannot be used as an index type
    defaultAppRc.context[context] = rc.context[context];

    await writeData(join(path, '.appsemblerc.yaml'), defaultAppRc, { sort: false });
    await rm(appVariantPath, { recursive: true });
    logger.info(`Removed ${appVariantPath}`);
  }
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
   * The shared variant to use instead.
   */
  variant?: string;

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
  template?: boolean;

  /**
   * Whether the App should be used in demo mode.
   */
  demoMode?: boolean;

  /**
   * Whether resources from the `resources` directory should be published after publishing the app.
   */
  resources?: boolean;

  /**
   * Whether assets from the `assets` directory should be published after publishing the app.
   */
  assets?: boolean;

  /**
   * Whether published assets should be clonable. Ignored if `assets` equals false.
   */
  assetsClonable?: boolean;

  /**
   * Whether the locked property should be ignored.
   */
  force: boolean;

  /**
   * The icon to upload.
   */
  icon?: NodeJS.ReadStream | ReadStream;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground?: string;

  /**
   * The maskable icon to upload.
   */
  maskableIcon?: NodeJS.ReadStream | ReadStream;

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
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const appsembleContext = await retrieveContext(path, context);
  let yaml: string;
  let filename = relative(process.cwd(), path);

  const variant = appsembleContext.variant ?? options.variant ?? context;

  let appVariantPath = path;
  if (variant && existsSync(join(path, 'variants', variant))) {
    await applyAppVariant(path, variant);
    appVariantPath = join(dirname(path), `${basename(path)}-${variant}`);
  } else {
    logger.warn(
      `App variant ${variant} is not defined in ${join(path, 'variants')}. Using default app.`,
    );
  }

  if (file.isFile()) {
    const [, data] = await readData(appVariantPath);
    yaml = data;
    formData.append('yaml', data);
  } else {
    let appsembleVariantContext;
    [appsembleVariantContext, , yaml] = await traverseAppDirectory(
      appVariantPath,
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      context,
      formData,
    );
    if (appsembleVariantContext.icon) {
      appsembleContext.icon = appsembleVariantContext.icon;
    }
    if (appsembleVariantContext.maskableIcon) {
      appsembleContext.maskableIcon = appsembleVariantContext.maskableIcon;
    }
    filename = join(filename, 'app-definition.yaml');
  }

  const remote = appsembleContext.remote ?? options.remote;
  const id = appsembleContext.id ?? options.id;
  const template = appsembleContext.template ?? options.template ?? false;
  const assetsClonable = appsembleContext.assetsClonable ?? options.assetsClonable ?? false;
  const demoMode = appsembleContext.demoMode ?? options.demoMode ?? false;
  const visibility = appsembleContext.visibility ?? options.visibility;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  const sentryDsn = appsembleContext.sentryDsn ?? options.sentryDsn;
  const sentryEnvironment = appsembleContext.sentryEnvironment ?? options.sentryEnvironment;
  const googleAnalyticsId = appsembleContext.googleAnalyticsId ?? options.googleAnalyticsId;
  const resources = appsembleContext.resources ?? options.resources;
  const assets = appsembleContext.assets ?? options.assets;
  const { appLock } = appsembleContext;

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

  let authScope = 'apps:write';

  if (resources) {
    authScope += ' resources:write';
  }

  if (assets) {
    authScope += ' assets:write';
  }

  await authenticate(remote, authScope, clientCredentials);

  if (appLock) {
    logger.info(`Setting AppLock to ${appLock}`);
    try {
      await axios.post(`/api/apps/${id}/lock`, {
        locked: appLock,
      });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  let data: App;
  try {
    ({ data } = await axios.patch<App>(`/api/apps/${id}`, formData, { baseURL: remote }));
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if ((error.response?.data as { message?: string })?.message !== 'App validation failed') {
      throw error;
    }
    throw new AppsembleError(
      printAxiosError(filename, yaml, (error.response?.data as any).data.errors),
    );
  }

  if (file.isDirectory()) {
    // After uploading the app, upload block styles and messages if they are available
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await traverseBlockThemes(appVariantPath, data.id, remote, force);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await uploadMessages(appVariantPath, data.id, remote, force);
    await publishAppConfig(appVariantPath, data, remote);

    // After updating the app, publish seed resources and assets if they are available
    if (assets && (data.locked !== 'fullLock' || force)) {
      await publishSeedAssets(appVariantPath, data, remote, assetsClonable);
    }

    if (resources && (data.locked !== 'fullLock' || force)) {
      await publishSeedResources(appVariantPath, data, remote);
    }
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);

  if (appVariantPath !== path) {
    await rm(appVariantPath, { recursive: true });
    logger.info(`Removed ${appVariantPath}`);
  }
}

interface PatchAppParams {
  /**
   * The path at which the app is hosted.
   */
  path?: string;

  /**
   * Whether the locked property should be ignored.
   */
  force?: boolean;

  /**
   * The ID of the app to update.
   */
  id?: number;

  /**
   * Visibility of the app in the public app store.
   */
  visibility?: AppVisibility;

  /**
   * The remote server to create the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template?: boolean;

  /**
   * Whether the App should be used in demo mode.
   */
  demoMode?: boolean;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground?: string;

  /**
   * Whether or not the app definition is exposed for display in Appsemble Studio.
   */
  showAppDefinition?: boolean;

  /**
   * Whether the Appsemble password login method should be shown.
   */
  showAppsembleLogin?: boolean;

  /**
   * Whether to display the app member name in the title bar.
   */
  displayAppMemberName?: boolean;

  /**
   * Whether to prompt the app users to display the installation prompts
   */
  displayInstallationPrompt?: boolean;

  /**
   * Whether the Appsemble OAuth2 login method should be shown.
   */
  showAppsembleOAuth2Login?: boolean;

  /**
   * Whether new users should be able to register themselves.
   */
  enableSelfRegistration?: boolean;

  /**
   * Whether the app is currently locked.
   */
  locked?: AppLock;
}

export async function patchApp({ id, remote, ...options }: PatchAppParams): Promise<void> {
  const formData = new FormData();
  if (options.path !== undefined) {
    logger.info(`Setting app path to ${options.path}`);
    formData.append('path', options.path);
  }
  if (options.force !== undefined) {
    formData.append('force', String(options.force));
  }
  if (options.demoMode !== undefined) {
    logger.info(`Setting app demo mode to ${options.demoMode}`);
    formData.append('demoMode', String(options.demoMode));
  }
  if (options.template !== undefined) {
    logger.info(`Setting template to ${options.template}`);
    formData.append('template', String(options.template));
  }
  if (options.visibility !== undefined) {
    logger.info(`Setting app visibility to ${options.visibility}`);
    formData.append('visibility', options.visibility);
  }
  if (options.iconBackground !== undefined) {
    logger.info(`Setting app icon background to ${options.iconBackground}`);
    formData.append('iconBackground', options.iconBackground);
  }
  if (options.showAppDefinition !== undefined) {
    logger.info(`Setting showAppDefinition to ${options.showAppDefinition}`);
    formData.append('showAppDefinition', String(options.showAppDefinition));
  }
  if (options.showAppsembleLogin !== undefined) {
    logger.info(`Setting showAppsembleLogin to ${options.showAppsembleLogin}`);
    formData.append('showAppsembleLogin', String(options.showAppsembleLogin));
  }
  if (options.displayAppMemberName !== undefined) {
    logger.info(`Setting displayAppMemberName to ${options.displayAppMemberName}`);
    formData.append('displayAppMemberName', String(options.displayAppMemberName));
  }
  if (options.displayInstallationPrompt !== undefined) {
    logger.info(`Setting displayInstallationPrompt to ${options.displayInstallationPrompt}`);
    formData.append('displayInstallationPrompt', String(options.displayInstallationPrompt));
  }
  if (options.showAppsembleOAuth2Login !== undefined) {
    logger.info(`Setting showAppsembleOAuth2Login to ${options.showAppsembleOAuth2Login}`);
    formData.append('showAppsembleOAuth2Login', String(options.showAppsembleOAuth2Login));
  }
  if (options.enableSelfRegistration !== undefined) {
    logger.info(`Setting enableSelfRegistration to ${options.enableSelfRegistration}`);
    formData.append('enableSelfRegistration', String(options.enableSelfRegistration));
  }
  try {
    if (!formData.getLengthSync() && options.locked === undefined) {
      logger.warn('Nothing to patch. Need at least one additional argument to patch app.');
      return;
    }
    if (formData.getLengthSync()) {
      const { data } = await axios.patch<App>(`/api/apps/${id}`, formData);
      logger.info(`Successfully updated app with id ${id}`);
      const { host, protocol } = new URL(remote);
      logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
    }
    if (options.locked !== undefined) {
      await axios.post(`/api/apps/${id}/lock`, {
        locked: options.locked,
      });
      logger.info(`Successfully set app lock value for app with id ${id} to ${options.locked}`);
    }
    logger.info(`App store page: ${new URL(`/apps/${id}`, remote)}`);
  } catch (error) {
    logger.error(error);
  }
}
