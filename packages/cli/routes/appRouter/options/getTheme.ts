import { GetThemeParams, Theme as ThemeInterface } from '@appsemble/node-utils/types';

import { Theme } from '../../../models/index.js';

export const getTheme = async ({ theme }: GetThemeParams): Promise<ThemeInterface> => {
  const persistedTheme = await Theme.findOne({ where: theme });
  return {
    css: persistedTheme.css,
  };
};
