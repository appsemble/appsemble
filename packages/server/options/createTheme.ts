import {
  CreateThemeParams,
  Theme as ThemeInterface,
} from 'packages/node-utils/server/types';

import { Theme } from '../models';

export const createTheme = ({ css, ...theme }: CreateThemeParams): Promise<ThemeInterface> =>
  Theme.create({ ...theme, css });
