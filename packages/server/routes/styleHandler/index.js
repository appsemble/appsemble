import fs from 'fs';
import sass from 'node-sass';

const baseStyle = fs.readFileSync(require.resolve('./bulma.scss'), 'utf8').split(/\r?\n/);

/**
 * Process SASS styles based on given parameters.
 *
 * @param {Object} params
 * @returns {string} SASS string containing the base Appsemble style augmented by user parameters.
 */
function processStyle(params) {
  const style = [...baseStyle];
  const bulmaPath = require.resolve('bulma/bulma.sass');
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

  // Syntax: https://sass-lang.com/documentation/breaking-changes/css-vars
  style.push(
    ':root {',
    '--primary-color: #{$primary};',
    '--link-color: #{$link};',
    '--success-color: #{$success};',
    '--info-color: #{$info};',
    '--warning-color: #{$warning};',
    '--danger-color: #{$danger};',
    '--success-color: #{$success};',
    '--primary-color-invert: #{$primary-invert};',
    '--link-color-invert: #{$link-invert};',
    '--success-color-invert: #{$success-invert};',
    '--info-color-invert: #{$info-invert};',
    '--warning-color-invert: #{$warning-invert};',
    '--danger-color-invert: #{$danger-invert};',
    '--success-color-invert: #{$success-invert};',
    '}',
  );

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
