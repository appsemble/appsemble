import { type GetThemeParams, type Theme as ThemeInterface } from '@appsemble/node-utils';

import { Theme } from '../models/Theme.js';

export async function getTheme({ theme }: GetThemeParams): Promise<ThemeInterface | null> {
  const persistedTheme = await Theme.findOne({ where: theme });
  return persistedTheme && { css: persistedTheme.css };
}
