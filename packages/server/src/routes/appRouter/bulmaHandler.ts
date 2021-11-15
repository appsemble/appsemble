import { Theme as ThemeType } from '@appsemble/types';
import { baseTheme } from '@appsemble/utils';
import bulma from 'bulma/package.json';
import { Context } from 'koa';
import sass from 'sass';
import stripBom from 'strip-bom';

import { Theme } from '../../models';

const bulmaPath = require.resolve('bulma/bulma.sass').replace(/\\/g, '/');
const functionPath = require.resolve('bulma/sass/utilities/functions.sass').replace(/\\/g, '/');
const checkRadioPath = require.resolve('bulma-checkradio/src/sass/index.sass').replace(/\\/g, '/');
const bulmaSwitchPath = require.resolve('bulma-switch/src/sass/index.sass').replace(/\\/g, '/');

interface QueryParamTheme extends Omit<Partial<ThemeType>, 'font'> {
  fontFamily?: string;
  fontSource?: string;
}

function getOneQueryParameter<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
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
      getOneQueryParameter(query.primaryColor) || baseTheme.primaryColor
    ).toLocaleLowerCase(),
    linkColor: (getOneQueryParameter(query.linkColor) || baseTheme.linkColor).toLocaleLowerCase(),
    successColor: (
      getOneQueryParameter(query.successColor) || baseTheme.successColor
    ).toLocaleLowerCase(),
    infoColor: (getOneQueryParameter(query.infoColor) || baseTheme.infoColor).toLocaleLowerCase(),
    warningColor: (
      getOneQueryParameter(query.warningColor) || baseTheme.warningColor
    ).toLocaleLowerCase(),
    dangerColor: (
      getOneQueryParameter(query.dangerColor) || baseTheme.dangerColor
    ).toLocaleLowerCase(),
    themeColor: (
      getOneQueryParameter(query.themeColor) || baseTheme.themeColor
    ).toLocaleLowerCase(),
    splashColor: (
      getOneQueryParameter(query.splashColor) || baseTheme.splashColor
    ).toLocaleLowerCase(),
    fontFamily: getOneQueryParameter(query.fontFamily) || baseTheme.font.family,
    fontSource: getOneQueryParameter(query.fontSource) || baseTheme.font.source,
  };

  const result = await Theme.findOne({ where: theme });
  let css = result?.css;
  if (!css) {
    css = stripBom(
      String(
        sass.renderSync({
          data: processStyle(theme),
          outputStyle: 'compressed',
        }).css,
      ),
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
