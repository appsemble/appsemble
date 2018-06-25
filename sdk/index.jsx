/**
 * Register a boostrap function.
 *
 * @param {Function<ShadowRoot, Block, Actions>} fn The bootstrap function to register.
 */
// eslint-disable-next-line import/prefer-default-export
export function bootstrap(fn) {
  // eslint-disable-next-line no-underscore-dangle
  window.__appsemble.register(document.currentScript, fn);
}
