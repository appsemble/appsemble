import { Theme } from '@appsemble/types';
import { baseTheme } from '@appsemble/utils';
import autoprefixer from 'autoprefixer';
import { Context } from 'koa';
import postcss from 'postcss';
import sass from 'sass';

const bulmaPath = require.resolve('bulma/bulma.sass').replace(/\\/g, '/');
const functionPath = require.resolve('bulma/sass/utilities/functions.sass').replace(/\\/g, '/');
const checkRadioPath = require.resolve('bulma-checkradio/src/sass/index.sass').replace(/\\/g, '/');
const bulmaSwitchPath = require.resolve('bulma-switch/src/sass/index.sass').replace(/\\/g, '/');
const postCss = postcss([autoprefixer]);

/**
 * Process SASS styles based on given parameters.
 *
 * @param theme - The theme object to turn into a SASS file.
 * @returns SASS string containing the base Appsemble style augmented by user parameters.
 */
function processStyle(theme: Partial<Theme>): string {
  return `
    @charset "utf-8";
    @import url(https://fonts.googleapis.com/css?display=swap&family=Open+Sans);
    $family-sans-serif: 'Open Sans', sans-serif !default;
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
export function bulmaHandler(ctx: Context): void {
  const { css } = sass.renderSync({
    data: processStyle(ctx.query),
    outputStyle: 'compressed',
  });

  ctx.body = postCss.process(css).css;
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
