import { createRequire } from 'node:module';

import { baseTheme, type Theme as ThemeType } from '@appsemble/lang-sdk';
import { bulmaVersion, logger, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';
import { renderSync } from 'sass';
import stripBom from 'strip-bom';

const require = createRequire(import.meta.url);

const bulmaPath = require.resolve('bulma/bulma.sass').replaceAll('\\', '/');
const functionPath = require.resolve('bulma/sass/utilities/functions.sass').replaceAll('\\', '/');
const checkRadioPath = require
  .resolve('bulma-checkradio/src/sass/index.sass')
  .replaceAll('\\', '/');
const bulmaSliderPath = require.resolve('bulma-slider/src/sass/index.sass').replaceAll('\\', '/');
const bulmaSwitchPath = require.resolve('bulma-switch/src/sass/index.sass').replaceAll('\\', '/');

interface QueryParamTheme extends Omit<Partial<ThemeType>, 'font'> {
  fontFamily?: string;
  fontSource?: string;
}

function getQueryParameter<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Process SASS styles based on given parameters.
 *
 * @param theme The theme object to turn into a SASS file.
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
    @import "${bulmaSliderPath}";
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

export function createBulmaHandler({ createTheme, getTheme }: Options): Middleware {
  return async (ctx: Context) => {
    const { query } = ctx;

    const theme: Omit<Partial<ThemeType>, 'font'> & {
      bulmaVersion: string;
      fontFamily: string;
      fontSource: string;
    } = {
      bulmaVersion,
      primaryColor: (getQueryParameter(query.primaryColor) || baseTheme.primaryColor).toLowerCase(),
      linkColor: (getQueryParameter(query.linkColor) || baseTheme.linkColor).toLowerCase(),
      successColor: (getQueryParameter(query.successColor) || baseTheme.successColor).toLowerCase(),
      infoColor: (getQueryParameter(query.infoColor) || baseTheme.infoColor).toLowerCase(),
      warningColor: (getQueryParameter(query.warningColor) || baseTheme.warningColor).toLowerCase(),
      dangerColor: (getQueryParameter(query.dangerColor) || baseTheme.dangerColor).toLowerCase(),
      themeColor: (getQueryParameter(query.themeColor) || baseTheme.themeColor).toLowerCase(),
      splashColor: (getQueryParameter(query.splashColor) || baseTheme.splashColor).toLowerCase(),
      fontFamily: getQueryParameter(query.fontFamily) || baseTheme.font.family,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      fontSource: getQueryParameter(query.fontSource) || baseTheme.font.source,
    };

    const result = await getTheme({ theme });

    let css = result?.css;

    if (!css) {
      css = stripBom(
        String(
          renderSync({
            data: processStyle(theme),
            outputStyle: 'compressed',
            logger: {
              debug(message) {
                logger.silly(message);
              },
              warn(message, { deprecation }) {
                if (!deprecation) {
                  logger.verbose(message);
                }
              },
            },
          }).css,
        ),
      );
    }

    ctx.body = css;
    ctx.type = 'text/css';
    ctx.set('Cache-Control', 'max-age=31536000,immutable');

    if (!result) {
      // This is not awaited on purpose.
      createTheme({ ...theme, css });
    }
  };
}
