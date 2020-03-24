import { baseTheme } from '@appsemble/utils';
import autoprefixer from 'autoprefixer';
import sass from 'node-sass';
import * as postcss from 'postcss';

const bulmaPath = require.resolve('bulma/bulma.sass').replace(/\\/g, '/');
const functionPath = require.resolve('bulma/sass/utilities/functions.sass').replace(/\\/g, '/');
const checkRadioPath = require.resolve('bulma-checkradio/src/sass/index.sass').replace(/\\/g, '/');
const bulmaSwitchPath = require.resolve('bulma-switch/src/sass/index.sass').replace(/\\/g, '/');
const calendarPath = require.resolve('bulma-calendar/src/sass/index.sass').replace(/\\/g, '/');
const postCss = postcss([autoprefixer]);

/**
 * Process SASS styles based on given parameters.
 *
 * @param {Object} params
 * @returns {string} SASS string containing the base Appsemble style augmented by user parameters.
 */
function processStyle(params) {
  return `
    @charset "utf-8";
    @import url(https://fonts.googleapis.com/css?family=Libre+Franklin|Open+Sans);
    $family-sans-serif: 'Libre Franklin', sans-serif !default;
    $primary: ${params.primaryColor || baseTheme.primaryColor};
    $link: ${params.linkColor || baseTheme.linkColor};
    $info: ${params.infoColor || baseTheme.infoColor};
    $success: ${params.successColor || baseTheme.successColor};
    $warning: ${params.warningColor || baseTheme.warningColor};
    $danger: ${params.dangerColor || baseTheme.dangerColor};
    $themeColor: ${params.themeColor || baseTheme.themeColor};
    $splashColor: ${params.splashColor || baseTheme.splashColor};

    @import "${functionPath}";
    $themeColor-invert: findColorInvert($themeColor);
    $splashColor-invert: findColorInvert($splashColor);

    @import "${bulmaPath}";
    @import "${checkRadioPath}";
    @import "${bulmaSwitchPath}";
    @import "${calendarPath}";
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
 * @param {Koa.Context} ctx The Koa context.
 */
export default async function bulmaHandler(ctx) {
  const options = {
    data: processStyle(ctx.query),
    outputStyle: 'compressed',
  };

  const { css } = sass.renderSync(options);

  ctx.body = await postCss.process(css).css;
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
