import {
  CreateThemeParams,
  Theme as ThemeInterface,
} from '@appsemble/node-utils/server/types';

import { Theme } from '../models/Theme.js';

export const createTheme = ({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> =>
  Theme.create({ ...theme, css });
