import {
  CreateThemeParams,
  Theme as ThemeInterface,
} from '@appsemble/node-utils/server/routes/types.js';

import { Theme } from '../../../models/index.js';

export const createTheme = ({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> =>
  Theme.create({ ...theme, css });
