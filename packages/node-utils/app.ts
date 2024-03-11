import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import { type App, type AppsembleMessages, type UserInfo } from '@appsemble/types';
import { defaultLocale, has, objectCache, type RemapperContext } from '@appsemble/utils';
import { memoize } from '@formatjs/fast-memoize';
import { type CssNode, generate, parse, walk } from 'css-tree';
import { copy, ensureDir } from 'fs-extra';
import { IntlMessageFormat } from 'intl-messageformat';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';
import lodash from 'lodash';
import { format, resolveConfig } from 'prettier';
import { parseDocument } from 'yaml';

import { readData, writeData } from './fs.js';
import { logger } from './logger.js';
import { type Options } from './server/types.js';

const getNumberFormat = memoize(
  (locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts),
);

const getPluralRules = memoize(
  (locale: string, opts: Intl.PluralRulesOptions) => new Intl.PluralRules(locale, opts),
);

/**
 * Get a context for remappers based on an app definition.
 *
 * This allows to use remappers with the context of an app on the server.
 *
 * @param app The app for which to get the remapper context.
 * @param language The preferred language for the context.
 * @param userInfo The OAuth2 compatible user information.
 * @param options The API utility options.
 * @param context The koa context.
 * @returns A localized remapper context for the app.
 */
export async function getRemapperContext(
  app: App,
  language: string,
  userInfo: UserInfo,
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<RemapperContext> {
  const { getAppMessages, getAppUrl } = options;

  const appUrl = String(await getAppUrl({ context, app }));
  const appMessages = await getAppMessages({
    app,
    context,
    language,
  });

  const cache = objectCache(
    (message) =>
      new IntlMessageFormat(message, language, undefined, {
        formatters: {
          // @ts-expect-error intl-messageformat types are wrong
          getNumberFormat,
          getPluralRules,
          getDateTimeFormat: memoize(
            (locale: string, opts: Intl.DateTimeFormatOptions) =>
              new Intl.DateTimeFormat(locale, { ...opts, timeZone: userInfo?.zoneinfo }),
          ),
        },
      }),
  );

  return {
    appId: app.id,
    appUrl,
    url: appUrl,
    getMessage({ defaultMessage, id }) {
      const msg = appMessages.find(({ messages }) => has(messages.messageIds, id));
      const message = msg ? msg.messages.messageIds[id] : defaultMessage;
      return cache(message || `'{${id}}'`);
    },
    userInfo,
    appMember: userInfo?.appMember,
    context: {},
    locale: userInfo?.locale ?? app.definition.defaultLanguage ?? defaultLocale,
  };
}

function replaceStyle(
  stylesheet: CssNode,
  selector: string,
  property: string,
  value: string,
): CssNode {
  try {
    walk(stylesheet, (nodeSelector) => {
      if (nodeSelector.type !== 'Rule' || nodeSelector.prelude.type !== 'Raw') {
        return;
      }
      if (nodeSelector.prelude.value === selector) {
        walk(nodeSelector, (declaration) => {
          if (declaration.type !== 'Declaration' || declaration.value.type !== 'Raw') {
            return;
          }
          if (declaration.property === property) {
            // eslint-disable-next-line no-param-reassign
            declaration.value.value = value;
          }
        });
      }
    });
    return stylesheet;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Patch an app definition of an app inside the `apps` folder.
 *
 * @param appPath The path to the app to patch.
 * @param patches Patches to apply to the YAML.
 */
async function patchDefinition(
  appPath: string,
  patches: [key: (number | string)[], value: unknown][],
): Promise<void> {
  try {
    const path = join(appPath, 'app-definition.yaml');
    logger.verbose(`Updating ${path}`);
    const yaml = await readFile(path, 'utf8');
    const doc = parseDocument(yaml);
    for (const [key, value] of patches) {
      if (value === undefined) {
        doc.deleteIn(key);
      } else {
        doc.setIn(key, value);
      }
    }
    const prettierOptions = (await resolveConfig(path, { editorconfig: true }))!;
    prettierOptions.parser = 'yaml';
    await writeFile(path, await format(String(doc), prettierOptions));
    logger.verbose(`Successfully updated ${path}`);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Patch app messages.
 *
 * The replacements will be deep merged into the original content.
 *
 * @param appPath The name of the app to patch.
 * @param replacements Replacements for the original messages.
 */
async function patchMessages(
  appPath: string,
  replacements: Record<string, Partial<AppsembleMessages>>,
): Promise<void> {
  try {
    const i18nPath = join(appPath, 'i18n');
    for (const [language, replacementMessages] of Object.entries(replacements)) {
      const originalMessagesPath = join(i18nPath, `${language}.json`);
      logger.verbose(`Updating ${originalMessagesPath}`);
      const [originalMessages] = await readData<AppsembleMessages>(originalMessagesPath);
      await (replacementMessages
        ? writeData(originalMessagesPath, lodash.merge(originalMessages, replacementMessages))
        : rm(originalMessagesPath));
      logger.verbose(`Successfully updated ${originalMessagesPath}`);
    }
  } catch (error) {
    logger.error(error);
  }
}

interface StyleReplacement {
  selector: string;
  property: string;
  value: string;
}

async function patchStyle(
  replacementsPath: string,
  replacements: StyleReplacement[],
): Promise<void> {
  try {
    logger.verbose(`Updating ${replacementsPath}`);

    const cssFile = await readFile(replacementsPath, 'utf8');
    let doc = parse(cssFile, {
      parseAtrulePrelude: false,
      parseRulePrelude: false,
      parseValue: false,
    });

    for (const { property, selector, value } of replacements) {
      doc = replaceStyle(doc, selector, property, String(value));
    }

    await writeFile(replacementsPath, generate(doc));
    logger.verbose(`Successfully updated ${replacementsPath}`);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Patch the app's styles.
 *
 * @param appPath The path to the app to patch.
 * @param replacements Replacements for the original style.
 */
async function patchStyles(
  appPath: string,
  replacements: Record<
    string,
    Record<string, Record<string, StyleReplacement[]> | StyleReplacement[]>
  >,
): Promise<void> {
  try {
    const themePath = join(appPath, 'theme');

    // Style type can be @appsemble, shared or core
    for (const [styleType, replacementsByStyleType] of Object.entries(replacements)) {
      const styleTypePath = join(themePath, styleType);

      // FileOrBlock name can either be the name of a css file or the name of an appsemble block
      for (const [fileOrBlockName, replacementsByFileOrBlock] of Object.entries(
        replacementsByStyleType,
      )) {
        const fileOrBlockPath = join(styleTypePath, fileOrBlockName);

        if (Array.isArray(replacementsByFileOrBlock)) {
          await patchStyle(fileOrBlockPath, replacementsByFileOrBlock);
        } else {
          for (const [blockFilename, replacementsByFile] of Object.entries(
            replacementsByFileOrBlock,
          )) {
            const blockFilePath = join(fileOrBlockPath, blockFilename);
            await patchStyle(blockFilePath, replacementsByFile);
          }
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

async function transferAppVariantFiles(
  appPath: string,
  appVariantDefDir: string,
  appVariantDestDir: string,
  pathToCopy: string,
): Promise<void> {
  try {
    const defPathToCopy = join(appVariantDefDir, pathToCopy);

    if (existsSync(defPathToCopy)) {
      const existingPath = join(appVariantDestDir, pathToCopy);
      if (existsSync(existingPath)) {
        await rm(existingPath, { recursive: true });
      }
      await copy(defPathToCopy, join(appVariantDestDir, pathToCopy));
      logger.verbose(`Successfully copied ${pathToCopy} to ${appVariantDestDir}`);
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function applyAppVariant(appPath: string, appVariant: string): Promise<void> {
  try {
    logger.info(`Applying ${appVariant} variant to ${appPath}`);

    const appVariantDestDir = join(dirname(appPath), `${basename(appPath)}-${appVariant}`);

    await ensureDir(appVariantDestDir);
    logger.verbose(`Successfully created ${appVariantDestDir}`);

    await copy(appPath, appVariantDestDir);
    logger.verbose(`Successfully copied app files to ${appVariantDestDir}`);

    const appVariantDefDir = join(appPath, 'variants', appVariant);

    await transferAppVariantFiles(appPath, appVariantDefDir, appVariantDestDir, 'assets');
    await transferAppVariantFiles(appPath, appVariantDefDir, appVariantDestDir, 'resources');
    await transferAppVariantFiles(appPath, appVariantDefDir, appVariantDestDir, 'screenshots');
    await transferAppVariantFiles(appPath, appVariantDefDir, appVariantDestDir, 'icon.png');

    const patchesPath = join(appVariantDefDir, 'patches');

    const [definitionPatches] = await readData(join(patchesPath, 'app-definition.json'));
    await patchDefinition(appVariantDestDir, definitionPatches as []);

    const [messagesPatches] = await readData(join(patchesPath, 'messages.json'));
    await patchMessages(
      appVariantDestDir,
      messagesPatches as Record<string, Partial<AppsembleMessages>>,
    );

    const [stylesPatches] = await readData(join(patchesPath, 'styles.json'));
    await patchStyles(
      appVariantDestDir,
      stylesPatches as Record<
        string,
        Record<string, Record<string, StyleReplacement[]> | StyleReplacement[]>
      >,
    );

    logger.info(`Successfully applied ${appVariant} variant to ${appPath}`);
    logger.verbose(`The ${appVariant} variant app can be found in ${appVariantDestDir}`);
  } catch (error) {
    logger.error(error);
  }
}
