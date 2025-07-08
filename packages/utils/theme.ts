import { baseTheme, type Theme } from '@appsemble/lang-sdk';

/**
 * Declare URLSearchParams in way that’s compatible between `dom` lib and `node` types.
 */
declare class URLSearchParams {
  constructor(params: Record<string, string>);

  sort(): void;
}

/**
 * Merge multiple partial themes and the base theme into one resulting theme.
 *
 * @param themes The themes to merge. The later a theme is specified, the higher its priority.
 * @returns A combination of all themes.
 */
export function mergeThemes(...themes: Partial<Theme>[]): Theme {
  const result = Object.assign({}, baseTheme, ...themes) as Theme;
  result.font.source ||= 'google';
  return result;
}

/**
 * Create a Bulma URL for an Appsemble theme.
 *
 * @param theme The theme to create a URL for.
 * @returns The URL to the Bulma theme.
 */
export function createThemeURL(theme: Theme): string {
  const { font, ...rest } = theme;
  const params = new URLSearchParams({
    ...rest,
    fontFamily: font.family,
    fontSource: font.source ?? '',
  });
  // Sort for cacheability.
  params.sort();
  return `/bulma/0.9.3/bulma.min.css?${params}`;
}
