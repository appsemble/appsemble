import { GetAppMessagesParams } from '@appsemble/node-utils/server/types';
import { AppMessages as AppMessagesInterface } from '@appsemble/types';
import { Op } from 'sequelize';

import { AppMessages } from '../models/AppMessages.js';

export const getAppMessages = ({
  app,
  baseLang,
  lang,
  merge,
}: GetAppMessagesParams): Promise<AppMessagesInterface[]> =>
  AppMessages.findAll({
    attributes: ['language'],
    where: {
      AppId: app.id,
      ...(merge && baseLang ? { language: { [Op.or]: [baseLang, lang] } } : { language: lang }),
    },
  });
