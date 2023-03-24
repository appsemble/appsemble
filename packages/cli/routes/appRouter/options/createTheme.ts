import { CreateThemeParams, Theme as ThemeInterface } from '@appsemble/node-utils/types';

import { Theme } from '../../../mocks/db/models/Theme.js';

export const createTheme = ({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> =>
  Theme.create({ ...theme, css });
