import fs from 'fs';
import sass from 'node-sass';

/**
 * Process SASS styles based on given parameters.
 *
 * @param {Object} params
 * @returns {string} SASS string containing the base Appsemble style augmented by user parameters.
 */
function processStyle(params) {
  const style = fs.readFileSync(require.resolve('./bulma.scss'), 'utf8').split(/\r?\n/);
  const bulmaPath = require.resolve('bulma/bulma.sass');
  const checkRadioPath = require.resolve('bulma-checkradio/src/sass/index.sass');

  const mappings = {
    primaryColor: 'primary',
    linkColor: 'link',
    infoColor: 'info',
    successColor: 'success',
    warningColor: 'warning',
    dangerColor: 'danger',
  };

  Object.entries(params).forEach(([key, value]) => {
    if (mappings[key]) {
      style.push(`$${mappings[key]}: ${value};`);
    }
  });

  style.push(`@import "${bulmaPath}";`);
  style.push(`@import "${checkRadioPath}";`);

  return style.join('\n');
}

/**
 * Serve the minified Bulma CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export function bulmaHandler(ctx) {
  const options = {
    data: processStyle(ctx.query),
    outputStyle: 'compressed',
  };

  const { css } = sass.renderSync(options);

  ctx.body = css;
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}

/**
 * Serve the minified FontAwesome CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export function faHandler(ctx) {
  ctx.body = fs.readFileSync(require.resolve('@fortawesome/fontawesome-free/css/all.min.css'));
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
