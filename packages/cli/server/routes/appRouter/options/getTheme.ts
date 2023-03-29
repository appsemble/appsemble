import { GetThemeParams, Theme as ThemeInterface } from 'packages/node-utils/server/routes/types';

import { Theme } from '../../../models/Theme.js';

export const getTheme = async ({ theme }: GetThemeParams): Promise<ThemeInterface> => {
  const persistedTheme = await Theme.findOne({ where: theme });
  return {
    css: persistedTheme ? persistedTheme.css : null,
  };
};
