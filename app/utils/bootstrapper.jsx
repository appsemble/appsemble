const bootstrappers = new Map();
const resolvers = new Map();
const loadedBlocks = new Set();

/**
 * Register a bootstrap function for a block.
 *
 * @param {HTMLScriptElement} scriptNode The script node on which to register the bootstrap
 * function.
 * @param {CustomEvent} event the event that was used to register the bootstrap function.
 * @param {string} blockDefId The id of the block definition for which a boostrap function is being
 * registered.
 */
export function register(scriptNode, event, blockDefId) {
  const { document, fn } = event.detail;
  if (scriptNode !== event.target || scriptNode !== document.currentScript) {
    throw new Error(
      'Block bootstrapper was registered from within an unhandled node. What’s going on?',
    );
  }
  if (bootstrappers.has(blockDefId)) {
    throw new Error(
      'It appears this block has already been bootstrapped. Did you call bootstrap twice?',
    );
  }
  if (!(fn instanceof Function)) {
    throw new Error(
      'No function was passed to bootstrap(). It takes a function as its first argument.',
    );
  }
  bootstrappers.set(blockDefId, fn);
  const callbacks = resolvers.get(blockDefId);
  resolvers.delete(blockDefId);
  if (!callbacks) {
    throw new Error('This block shouldn’t have been loaded. What’s going on?');
  }
  callbacks.forEach(resolve => resolve(fn));
}

function getBootstrap(blockDefId) {
  if (bootstrappers.has(blockDefId)) {
    return bootstrappers.get(blockDefId);
  }
  if (!resolvers.has(blockDefId)) {
    resolvers.set(blockDefId, []);
  }
  const waiting = resolvers.get(blockDefId);
  return new Promise(resolve => {
    waiting.push(resolve);
  });
}

/**
 * Call the bootstrap function for a block definition
 *
 * @param {Object} blockDef The block definition whose bootstrap function to call.
 * @param {Object} params any named parameters that will be passed to the block boostrap function.
 */
export async function callBootstrap(blockDef, params) {
  if (!loadedBlocks.has(blockDef.id)) {
    blockDef.files.filter(url => url.endsWith('.js')).forEach(url => {
      const script = document.createElement('script');
      script.src = url;
      script.addEventListener('AppsembleBootstrap', event => {
        event.stopImmediatePropagation();
        event.preventDefault();
        register(script, event, blockDef.id);
      });
      document.head.appendChild(script);
    });
    loadedBlocks.add(blockDef.id);
  }
  const bootstrap = await getBootstrap(blockDef.id);
  await bootstrap(params);
}
