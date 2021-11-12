import { Theme as ThemeType } from '@appsemble/types';
import { baseTheme } from '@appsemble/utils';
import bulma from 'bulma/package.json';
import { Context } from 'koa';
import sass from 'sass';

import { Theme } from '../../models';

const bulmaPath = require.resolve('bulma/bulma.sass').replace(/\\/g, '/');
const functionPath = require.resolve('bulma/sass/utilities/functions.sass').replace(/\\/g, '/');
const checkRadioPath = require.resolve('bulma-checkradio/src/sass/index.sass').replace(/\\/g, '/');
const bulmaSwitchPath = require.resolve('bulma-switch/src/sass/index.sass').replace(/\\/g, '/');

interface QueryParamTheme extends Omit<Partial<ThemeType>, 'font'> {
  fontFamily?: string;
  fontSource?: string;
}

/**
 * Process SASS styles based on given parameters.
 *
 * @param theme - The theme object to turn into a SASS file.
 * @returns SASS string containing the base Appsemble style augmented by user parameters.
 */
function processStyle(theme: QueryParamTheme): string {
  const fontSource = theme.fontSource || baseTheme.font.source;
  const fontFamily = theme.fontFamily || baseTheme.font.family;
  let googleFontsImport = '';
  if (fontSource === 'google') {
    const googleFontsUrl = new URL('https://fonts.googleapis.com/css');
    googleFontsUrl.searchParams.set('display', 'swap');
    googleFontsUrl.searchParams.set('family', fontFamily);
    googleFontsImport = `@import url(${googleFontsUrl});`;
  }

  return `
    @charset "utf-8";
    ${googleFontsImport}
    $family-sans-serif: '${fontFamily}', sans-serif !default;
    $primary: ${theme.primaryColor || baseTheme.primaryColor};
    $link: ${theme.linkColor || baseTheme.linkColor};
    $info: ${theme.infoColor || baseTheme.infoColor};
    $success: ${theme.successColor || baseTheme.successColor};
    $warning: ${theme.warningColor || baseTheme.warningColor};
    $danger: ${theme.dangerColor || baseTheme.dangerColor};
    $themeColor: ${theme.themeColor || baseTheme.themeColor};
    $splashColor: ${theme.splashColor || baseTheme.splashColor};

    @import "${functionPath}";
    $themeColor-invert: findColorInvert($themeColor);
    $splashColor-invert: findColorInvert($splashColor);

    @import "${bulmaPath}";
    @import "${checkRadioPath}";
    @import "${bulmaSwitchPath}";
    // Syntax: https://sass-lang.com/documentation/breaking-changes/css-vars
    :root {
      --primary-color: #{$primary};
      --link-color: #{$link};
      --success-color: #{$success};
      --info-color: #{$info};
      --warning-color: #{$warning};
      --danger-color: #{$danger};
      --theme-color: #{$themeColor};
      --splash-color: #{$splashColor};
      --primary-color-invert: #{$primary-invert};
      --link-color-invert: #{$link-invert};
      --success-color-invert: #{$success-invert};
      --info-color-invert: #{$info-invert};
      --warning-color-invert: #{$warning-invert};
      --danger-color-invert: #{$danger-invert};
      --theme-color-invert: #{$themeColor-invert};
      --splash-color-invert: #{$splashColor-invert};
    }`;
}

/**
 * Serve the minified Bulma CSS.
 *
 * @param ctx - The Koa context.
 */
export async function bulmaHandler(ctx: Context): Promise<void> {
  const { query } = ctx;
  const theme: Omit<Partial<ThemeType>, 'font'> & {
    bulmaVersion: string;
    fontFamily: string;
    fontSource: string;
  } = {
    bulmaVersion: bulma.version,
    primaryColor: (
      (Array.isArray(query.primaryColor) ? query.primaryColor[0] : query.primaryColor) ||
      baseTheme.primaryColor
    ).toLocaleLowerCase(),
    linkColor: (
      (Array.isArray(query.linkColor) ? query.linkColor[0] : query.linkColor) || baseTheme.linkColor
    ).toLocaleLowerCase(),
    successColor: (
      (Array.isArray(query.successColor) ? query.successColor[0] : query.successColor) ||
      baseTheme.successColor
    ).toLocaleLowerCase(),
    infoColor: (
      (Array.isArray(query.infoColor) ? query.infoColor[0] : query.infoColor) || baseTheme.infoColor
    ).toLocaleLowerCase(),
    warningColor: (
      (Array.isArray(query.warningColor) ? query.warningColor[0] : query.warningColor) ||
      baseTheme.warningColor
    ).toLocaleLowerCase(),
    dangerColor: (
      (Array.isArray(query.dangerColor) ? query.dangerColor[0] : query.dangerColor) ||
      baseTheme.dangerColor
    ).toLocaleLowerCase(),
    themeColor: (
      (Array.isArray(query.themeColor) ? query.themeColor[0] : query.themeColor) ||
      baseTheme.themeColor
    ).toLocaleLowerCase(),
    splashColor: (
      (Array.isArray(query.splashColor) ? query.splashColor[0] : query.splashColor) ||
      baseTheme.splashColor
    ).toLocaleLowerCase(),
    fontFamily:
      (Array.isArray(query.fontFamily) ? query.fontFamily[0] : query.fontFamily) ||
      baseTheme.font.family,
    fontSource:
      (Array.isArray(query.fontSource) ? query.fontSource[0] : query.fontSource) ||
      baseTheme.font.source,
  };

  const result = await Theme.findOne({ where: theme });
  let css = result?.css;
  if (!css) {
    css = String(
      sass.renderSync({
        data: processStyle(theme),
        outputStyle: 'compressed',
      }).css,
    );
  }

  ctx.body = css;
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');

  if (!result) {
    // This is not awaited on purpose.
    Theme.create({ ...theme, css });
  }
}
