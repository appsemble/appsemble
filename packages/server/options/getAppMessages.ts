import { GetAppMessagesParams } from '@appsemble/node-utils/server/types';
import { AppMessages as AppMessagesInterface } from '@appsemble/types';
import tags from 'language-tags';
import { Op } from 'sequelize';

import { AppMessages } from '../models/AppMessages.js';

export const getAppMessages = ({
  app,
  context,
  language,
}: GetAppMessagesParams): Promise<AppMessagesInterface[]> => {
  const { merge } = context.query || { merge: undefined };

  const lang = language.toLowerCase();
  const languages = lang.split(/-/g);

  const baseLanguage = tags(language)
    .subtags()
    .find((sub) => sub.type() === 'language');

  const baseLang = baseLanguage && String(baseLanguage).toLowerCase();

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
};
