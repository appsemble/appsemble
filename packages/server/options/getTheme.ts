import { type GetThemeParams, type Theme as ThemeInterface } from '@appsemble/node-utils';

import { Theme } from '../models/index.js';

export async function getTheme({ theme }: GetThemeParams): Promise<ThemeInterface> {
  const persistedTheme = await Theme.findOne({ where: theme });
  return {
    css: persistedTheme ? persistedTheme.css : '',
  };
}
