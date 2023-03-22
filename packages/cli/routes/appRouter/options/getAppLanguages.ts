import { GetAppLanguagesParams } from '@appsemble/node-utils/types';

import { AppMessages } from '../../../mocks/db/models/AppMessages.js';

export const getAppLanguages = async ({
  app,
  defaultLanguage,
}: GetAppLanguagesParams): Promise<string[]> => {
  const appMessages = await AppMessages.findAll({
    where: { AppId: app.id },
  });

  return [...new Set([...appMessages.map(({ language }) => language), defaultLanguage])].sort();
};
