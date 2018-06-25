const bootstrappers = new Map();
const resolvers = new Map();
const loadedBlocks = new Set();


/**
 * Register a bootstrap function for a block.
 *
 * This function is exposed on the global `__appsemble` object.
 *
 * @param {HTMLScriptElement} scriptNode The script node on which to register the bootstrap
 * function.
 * @param {Function<ShadowRoot, Block>} fn The bootstrap function to register.
 */
export function register(scriptNode, fn) {
  const { block } = scriptNode.dataset;
  if (!block) {
    throw new Error('Block bootstrapper was registered from within an unhandled node. What’s going on?');
  }
  if (bootstrappers.has(block)) {
    throw new Error('It appears this block has already been bootstrapped. Did you call bootstrap twice?');
  }
  bootstrappers.set(block, fn);
  const callbacks = resolvers.get(block);
  resolvers.delete(block);
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
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}


/**
 * Call the bootstrap function for a block definition
 *
 * @param {Object} blockDef The block definition whose bootstrap function to call.
 * @param {ShadowRoot} shadow The shadow root on which the block should be loaded.
 * @param {Object} block The block which should be bootstrapped.
 */
export async function callBootstrap(blockDef, shadow, block) {
  if (!loadedBlocks.has(blockDef.id)) {
    blockDef.files
      .filter(url => url.endsWith('.js'))
      .forEach((url) => {
        const script = document.createElement('script');
        script.src = `/blocks/${blockDef.id}/dist/${url}`;
        script.dataset.block = blockDef.id;
        document.head.appendChild(script);
      });
    loadedBlocks.add(blockDef.id);
  }
  const bootstrap = await getBootstrap(blockDef.id);
  await bootstrap(shadow, block);
}


Object.defineProperty(window, '__appsemble', {
  writable: false,
  value: Object.freeze({
    register,
  }),
});
