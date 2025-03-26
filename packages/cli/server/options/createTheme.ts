import { type CreateThemeParams, type Theme as ThemeInterface } from '@appsemble/node-utils';

import { Theme } from '../models/Theme.js';

export function createTheme({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return Theme.create({ ...theme, css });
}
