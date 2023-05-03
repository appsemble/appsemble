import { type CreateThemeParams, type Theme as ThemeInterface } from '@appsemble/node-utils';

import { Theme } from '../models/index.js';

export function createTheme({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> {
  return Theme.create({ ...theme, css });
}
