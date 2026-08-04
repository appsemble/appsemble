import { baseTheme, type Theme } from '@appsemble/lang-sdk';

/**
 * Declare URLSearchParams in way that’s compatible between `dom` lib and `node` types.
 */
declare class URLSearchParams {
  constructor(params: Record<string, string>);

  set(name: string, value: string): void;

  sort(): void;
}

/**
 * Merge multiple partial themes and the base theme into one resulting theme.
 *
 * Theme variables are merged per key, so a higher priority theme can override a single variable
 * while keeping the others.
 *
 * @param themes The themes to merge. The later a theme is specified, the higher its priority.
 * @returns A combination of all themes.
 */
export function mergeThemes(...themes: Partial<Theme>[]): Theme {
  const result = Object.assign({}, baseTheme, ...themes) as Theme;
  const variableMaps = themes.filter((theme) => theme?.variables);
  if (variableMaps.length) {
    result.variables = Object.assign({}, ...variableMaps.map((theme) => theme.variables));
  }
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
  const { font, variables, ...rest } = theme;
  const params = new URLSearchParams({
    ...rest,
    fontFamily: font.family,
    fontSource: font.source ?? '',
  });
  if (variables && Object.keys(variables).length) {
    // Serialize with sorted keys for cacheability.
    params.set('variables', JSON.stringify(variables, Object.keys(variables).sort()));
  }
  // Sort for cacheability.
  params.sort();
  return `/bulma/0.9.4/bulma.min.css?${params}`;
}
