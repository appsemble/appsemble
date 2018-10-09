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
 * @property {Object} data Any kind of data that has been passed in by some context.
 * @property {ShadowRoot} shadowRoot The shadow root to which DOM elements may be appended.
 */

/**
 * Register a boostrap function.
 *
 * @param {Function<BootstrapParams>} fn The bootstrap function to register.
 */
export function bootstrap(fn) {
  const event = new CustomEvent('AppsembleBootstrap', {
    detail: {
      fn,
      document,
    },
  });
  document.currentScript.dispatchEvent(event);
}


/**
 * Attach the returned node to the shadow root.
 *
 * This convenience wrapper attaches nodes returned by the bootstrap function to the shadow root.
 * This means that the initialization function for a block simply has to return a node, or an
 * iterator yielding nodes.
 *
 * @param {Function<BootstrapParams>} fn The bootstrap function to register.
 */
export function attach(fn) {
  return bootstrap(async (params) => {
    const { shadowRoot } = params;

    const nodes = await fn(params);
    if (nodes[Symbol.iterator]) {
      // eslint-disable-next-line no-restricted-syntax
      for (const node of nodes) {
        shadowRoot.appendChild(node);
      }
    } else if (nodes instanceof HTMLElement) {
      shadowRoot.appendChild(nodes);
    }
  });
}
