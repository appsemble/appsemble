import { type GetAppMessagesParams } from '@appsemble/node-utils';
import { type AppMessages as AppMessagesInterface } from '@appsemble/types';
import tags from 'language-tags';
import { Op } from 'sequelize';

import { AppMessages } from '../models/main/AppMessages.js';

export function getAppMessages({
  app,
  context,
  language,
}: GetAppMessagesParams): Promise<AppMessagesInterface[]> {
  const { merge } = context.query || { merge: undefined };

  if (language) {
    const lang = language.toLowerCase();
    const languages = lang.split(/-/g);

    const baseLanguage = tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language');

    const baseLang = baseLanguage && String(baseLanguage).toLowerCase();

    // XXX: Why do we have 3 types we could be returning here? Messages, AppMessages,
    // and AppMessages again but defined slightly differently in `types`
    //
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return AppMessages.findAll({
      order: [['language', 'desc']],
      where: {
        AppId: app.id,
        language: {
          [Op.or]: [
            ...(merge && baseLang ? [baseLang] : []),
            ...languages.map((la, i) => languages.slice(0, i + 1).join('-')),
          ],
        },
      },
    });
  }

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return AppMessages.findAll({
    where: { AppId: app.id },
  });
}
