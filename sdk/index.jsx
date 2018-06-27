/**
 * An action that can be called from within a block.
 * @typedef {Actions} Action
 * @property {Function} dispatch A function which can be called to dispatch the action.
 * @property {string} type The type of the action.
 */

/**
 * The parameters that get passed to the bootstrap function.
 * @typedef {Object} BootstrapParams
 * @property {Object<string, Action>} actions The actions that may be dispatched by the block.
 * @property {Object} block The block as it is defined in the app definition.
 * @property {ShadowRoot} shadowRoot The shadow root to which DOM elements may be appended.
 */

/**
 * Register a boostrap function.
 *
 * @param {Function<BootstrapParams>} fn The bootstrap function to register.
 */
// eslint-disable-next-line import/prefer-default-export
export function bootstrap(fn) {
  // eslint-disable-next-line no-underscore-dangle
  window.__appsemble.register(document.currentScript, fn);
}
