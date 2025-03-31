import { type GetThemeParams, type Theme as ThemeInterface } from '@appsemble/node-utils';

import { Theme } from '../models/Theme.js';

export async function getTheme({ theme }: GetThemeParams): Promise<ThemeInterface> {
  const persistedTheme = await Theme.findOne({ where: theme });
  return {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    css: persistedTheme ? persistedTheme.css : null,
  };
}
