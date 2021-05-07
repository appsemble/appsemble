import { AppsembleMessages } from '@appsemble/types';
import {
  compareStrings,
  defaultLocale,
  extractAppMessages,
  normalizeBlockName,
  Permission,
  validateLanguage,
} from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import tags from 'language-tags';
import { mergeWith } from 'lodash';
import { Op } from 'sequelize';

import { App, AppMessages, BlockMessages, BlockVersion } from '../models';
import { KoaContext } from '../types';
import { checkAppLock } from '../utils/checkAppLock';
import { checkRole } from '../utils/checkRole';
import { getAppsembleMessages } from '../utils/getAppsembleMessages';

interface Params {
  appId: string;
  language: string;
}

export async function getMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
    query: { merge, override = 'true' },
  } = ctx;

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language “${language}” is invalid`);
  }

  const lang = language.toLowerCase();
  const baseLanguage = tags(language)
    .subtags()
    .find((sub) => sub.type() === 'language');
  const baseLang = baseLanguage && String(baseLanguage).toLowerCase();

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMessages,
        where:
          merge && baseLang
            ? {
                language: { [Op.or]: [baseLang, lang] },
              }
            : { language: lang },
        required: false,
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const blockQuery: Pick<BlockVersion, 'name' | 'OrganizationId' | 'version'>[] = [];
  const coreMessages = await getAppsembleMessages(lang, baseLang);
  const appMessages: AppsembleMessages = {
    core: Object.fromEntries(
      Object.entries(coreMessages).filter(
        ([key]) => key.startsWith('app') || key.startsWith('react-components'),
      ),
    ),
    blocks: {},
    ...extractAppMessages(app.definition, (block) => {
      const [org, name] = normalizeBlockName(block.type).split('/');
      blockQuery.push({ version: block.version, OrganizationId: org.slice(1), name });
    }),
  };

  const blockMessages = await BlockVersion.findAll({
    attributes: ['name', 'version', 'OrganizationId', 'id'],
    where: {
      [Op.or]: blockQuery,
    },
    include: [
      {
        model: BlockMessages,
        where: {
          language: baseLang ? [lang, baseLang, defaultLocale] : [lang, defaultLocale],
        },
      },
    ],
  });

  if (
    (!app.AppMessages.length || (merge && !app.AppMessages.some((m) => m.language === lang))) &&
    lang !== (app.definition.defaultLanguage || defaultLocale)
  ) {
    throw notFound(`Language “${language}” could not be found`);
  }

  const baseLanguageMessages =
    override === 'true' && app.AppMessages.find((m) => m.language === baseLang);
  const languageMessages = override === 'true' && app.AppMessages.find((m) => m.language === lang);

  blockMessages.forEach((version) => {
    const name = `@${version.OrganizationId}/${version.name}`;
    const defaultMessages = version.BlockMessages.find((m) => m.language === defaultLocale);
    const blockBaseLanguageMessages =
      baseLang && version.BlockMessages.find((m) => m.language === baseLang);
    const blockLanguageMessages = version.BlockMessages.find((m) => m.language === language);

    const blockVersionMessages = {
      ...defaultMessages.messages,
      ...Object.fromEntries(
        Object.entries(blockBaseLanguageMessages?.messages ?? {}).filter(([, value]) => value),
      ),
      ...Object.fromEntries(
        Object.entries(blockLanguageMessages?.messages ?? {}).filter(([, value]) => value),
      ),
    };
    if (appMessages.blocks[name]) {
      appMessages.blocks[name][version.version] = blockVersionMessages;
    } else {
      appMessages.blocks[name] = {
        [version.version]: blockVersionMessages,
      };
    }
  });

  ctx.body = {
    language: lang,
    messages: mergeWith(
      appMessages,
      baseLanguageMessages?.messages ?? {},
      languageMessages?.messages ?? {},
      (objectValue, newValue) => {
        if (typeof newValue === 'string') {
          return newValue || objectValue;
        }
      },
    ),
  };
}

export async function createMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { language },
    },
  } = ctx;

  const app = await App.findOne({ where: { id: appId } });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language “${language}” is invalid`);
  }

  const messages = Object.fromEntries(
    Object.entries(ctx.request.body.messages).filter(([, value]) => value),
  );
  await AppMessages.upsert({ AppId: app.id, language: language.toLowerCase(), messages });
  ctx.body = { language: language.toLowerCase(), messages };
}

export async function deleteMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  if (!affectedRows) {
    throw notFound(`App does not have messages for “${language}”`);
  }
}

export async function getLanguages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort(compareStrings);
}
