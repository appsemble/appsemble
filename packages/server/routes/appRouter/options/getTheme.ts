import { GetThemeParams, Theme as ThemeInterface } from 'packages/node-utils/server/routes/types';

import { Theme } from '../../../models/index.js';

export const getTheme = async ({ theme }: GetThemeParams): Promise<ThemeInterface> => {
  const persistedTheme = await Theme.findOne({ where: theme });
  return {
    css: persistedTheme.css,
  };
};
