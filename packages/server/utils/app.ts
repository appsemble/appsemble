import { randomBytes } from 'node:crypto';

import {
  assertKoaError,
  getSupportedLanguages,
  logger,
  mergeMessages,
  type TempFile,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { extractAppMessages, StyleValidationError } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';
import { lookup } from 'mime-types';
import {
  type FindOptions,
  type IncludeOptions,
  Op,
  type Transaction,
  UniqueConstraintError,
} from 'sequelize';
import sharp from 'sharp';

import { argv } from './argv.js';
import { App, AppMessages, AppReadme, AppScreenshot } from '../models/index.js';

interface GetAppValue {
  /**
   * The app for the request context.
   */
  app?: App;

  /**
   * The path of the app being requested.
   */
  appPath?: string;

  /**
   * The organization Id of the app being requested.
   */
  organizationId?: string;
}

const localHostnames = new Set(['127.0.0.1', 'localhost']);

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional Sequelize query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 * @returns The app matching the url.
 */
export async function getApp(
  { origin }: Pick<Context, 'origin'>,
  queryOptions: FindOptions,
  url = origin,
): Promise<GetAppValue> {
  const platformHost = new URL(argv.host).hostname;
  const { hostname } = new URL(url);

  const value: GetAppValue = {
    app: undefined,
    appPath: undefined,
    organizationId: undefined,
  };

  const { where, ...findOptions } = queryOptions ?? { where: {} };

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname
      .slice(0, Math.max(0, hostname.length - platformHost.length - 1))
      .split('.');
    if (subdomain.length === 1) {
      [value.organizationId] = subdomain;
    } else if (subdomain.length === 2) {
      [value.appPath, value.organizationId] = subdomain;

      value.app = await App.findOne({
        where: {
          path: value.appPath,
          OrganizationId: value.organizationId,
          ...where,
        },
        ...findOptions,
      });
    }
  } else {
    value.app = await App.findOne({
      where: {
        ...(localHostnames.has(hostname) || hostname === platformHost ? {} : { domain: hostname }),
        ...where,
      },
      ...findOptions,
    });
  }
  return value;
}

export function getAppUrl(app: App): URL {
  const url = new URL(argv.host);
  url.hostname = app?.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
  return url;
}

/**
 * Sort apps by rating, in descending order.
 *
 * @param a The first app to compare.
 * @param b The second app to compare.
 * @returns Whether the first or second app goes first in terms of sorting.
 */
export function compareApps(a: App, b: App): number {
  if (a.RatingAverage != null && b.RatingAverage != null) {
    return b.RatingAverage - a.RatingAverage || b.RatingCount - a.RatingCount;
  }

  if (a.RatingAverage == null && b.RatingAverage == null) {
    return 0;
  }

  return a.RatingAverage == null ? 1 : -1;
}

/**
 * Extracts and parses the language from the query string of a request.
 *
 * @param ctx Context to throw back the errors in parsing.
 * @param input The language string to parse.
 * @returns An object containing the language, base language, and Sequelize filter
 *   to filter AppMessages by these languages.
 */
export function parseLanguage(
  ctx: Context,
  input: string[] | string,
): {
  language: string;
  baseLanguage: string;
  query: IncludeOptions[];
} {
  const language = Array.isArray(input) ? input[0] : input;
  if (!language) {
    return { language: undefined, baseLanguage: undefined, query: [] };
  }

  assertKoaError(!tags.check(language), ctx, 400, `Language “${language}” is invalid`);

  const lang = language?.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();
  const query = (
    language
      ? [
          {
            model: AppMessages,
            where: {
              language:
                baseLanguage && baseLanguage !== lang ? { [Op.or]: [baseLanguage, lang] } : lang,
            },
            required: false,
          },
        ]
      : []
  ) as IncludeOptions[];

  return { language: lang, baseLanguage, query };
}

/**
 * Applies `messages` property to an app model instance
 * based on the included `AppMessages` and languages.
 *
 * Note that this mutates `app`.
 *
 * @param app The app to apply the messages to.
 * @param language The language to search for within AppMessages.
 * @param baseLanguage The base language to search for within AppMessages.
 */
export function applyAppMessages(app: App, language: string, baseLanguage: string): void {
  if (app.AppMessages?.length) {
    const baseMessages =
      baseLanguage && app.AppMessages.find((messages) => messages.language === baseLanguage);
    const languageMessages = app.AppMessages.find((messages) => messages.language === language);

    Object.assign(app, {
      messages: mergeMessages(
        extractAppMessages(app.definition),
        baseMessages?.messages ?? {},
        languageMessages?.messages ?? {},
      ),
    });
  }
}

export async function setAppPath(ctx: Context, app: Partial<App>, path: string): Promise<void> {
  for (let i = 1; i < 10; i += 1) {
    const p = i === 1 ? path : `${path}-${i}`;
    const count = await App.count({ where: { path: p } });
    if (count === 0 && p.length < 30) {
      Object.assign(app, {
        path: p,
      });
      break;
    }
  }

  if (!app.path) {
    // Fallback if a suitable ID could not be found after trying for a while
    const randomPath = `${path}-${randomBytes(5).toString('hex')}`;
    if (randomPath.length < 30) {
      Object.assign(app, { path: randomPath });
    } else {
      throwKoaError(ctx, 400, 'Invalid path for app, please update the name of your app.');
    }
  }
}

export async function createAppScreenshots(
  appId: number,
  screenshots: TempFile[],
  transaction: Transaction,
  ctx: Context,
): Promise<AppScreenshot[]> {
  const screenshotsByLanguage: Record<string, TempFile[]> = {};
  const supportedLanguages = await getSupportedLanguages();

  for (const screenshot of screenshots) {
    const { filename } = screenshot;
    let language = filename.slice(0, filename.indexOf('-'));

    if (!supportedLanguages.has(language)) {
      language = 'unspecified';
    }

    screenshotsByLanguage[language] = [...(screenshotsByLanguage[language] || []), screenshot];
  }

  let createdScreenshots: AppScreenshot[] = [];
  for (const [language, languageScreenshots] of Object.entries(screenshotsByLanguage)) {
    const lastExistingScreenshot = await AppScreenshot.findOne({
      where: {
        AppId: appId,
        language,
      },
      attributes: ['index', 'language'],
      order: [['index', 'DESC']],
    });

    const sortedScreenshots = languageScreenshots.sort((a, b) => {
      const { filename: aFilename } = a;
      const { filename: bFilename } = b;
      if (aFilename > bFilename) {
        return 1;
      }
      if (aFilename < bFilename) {
        return -1;
      }
      return 0;
    });

    logger.verbose(`Storing ${languageScreenshots?.length ?? 0} ${language} screenshots`);

    const createdLanguageScreenshots = await AppScreenshot.bulkCreate(
      await Promise.all(
        sortedScreenshots.map(async ({ path }: TempFile, index) => {
          const contents = await uploadToBuffer(path);
          const img = sharp(contents);

          const { format, height, width } = await img.metadata();
          const mime = lookup(format);

          assertKoaError(!mime, ctx, 404, `Unknown screenshot mime type: ${mime}`);

          return {
            screenshot: contents,
            AppId: appId,
            index: lastExistingScreenshot ? lastExistingScreenshot.index + index + 1 : index,
            language,
            mime,
            width,
            height,
          };
        }),
      ),
      // These queries provide huge logs.
      { transaction, logging: false },
    );

    createdScreenshots = [...createdScreenshots, ...createdLanguageScreenshots];
  }

  return createdScreenshots;
}

export async function createAppReadmes(
  appId: number,
  readmes: TempFile[],
  transaction: Transaction,
): Promise<AppReadme[]> {
  const supportedLanguages = await getSupportedLanguages();

  return AppReadme.bulkCreate(
    await Promise.all(
      readmes.map(async ({ filename, path }: TempFile) => {
        const contents = await uploadToBuffer(path);
        let language = filename.slice(filename.indexOf('.') + 1, filename.lastIndexOf('.'));

        if (!supportedLanguages.has(language)) {
          language = 'unspecified';
        }

        return {
          AppId: appId,
          file: contents,
          language,
        };
      }),
    ),
    // These queries provide huge logs.
    { transaction, logging: false },
  );
}

export function handleAppValidationError(ctx: Context, error: Error, app: Partial<App>): never {
  if (error instanceof UniqueConstraintError) {
    throwKoaError(
      ctx,
      409,
      `Another app with path “@${app.OrganizationId}/${app.path}” already exists`,
    );
  }

  if (error instanceof StyleValidationError) {
    throwKoaError(ctx, 400, 'Provided CSS was invalid.');
  }

  if (error.message === 'Expected file ´coreStyle´ to be css') {
    throwKoaError(ctx, 400, error.message);
  }

  if (error.message === 'Expected file ´sharedStyle´ to be css') {
    throwKoaError(ctx, 400, error.message);
  }

  throw error;
}

/**
 * Resolves the icon url for an app based on whether it’s present and when it was updated.
 *
 * @param app The app to resolve the icon url for.
 * @returns A URL that can be safely cached.
 */
export function resolveIconUrl(app: App): string {
  const hasIcon = app.get('hasIcon') ?? Boolean(app.icon);

  if (hasIcon) {
    return `/api/apps/${app.id}/icon?${new URLSearchParams({
      maskable: 'true',
      updated: app.updated.toISOString(),
    })}`;
  }

  const organizationHasIcon = app.Organization?.get('hasIcon');
  if (organizationHasIcon) {
    return `/api/organizations/${app.OrganizationId}/icon?${new URLSearchParams({
      background: app.iconBackground || '#ffffff',
      maskable: 'true',
      updated: app.Organization.updated.toISOString(),
    })}`;
  }

  return null;
}
