/**
 * Normalize a block name by prefixing it with `@appsemble` is necessary.
 *
 * @param {string} name The input block name.
 * @returns {string} The normalized block name.
 */
export function normalizeBlockName(name) {
  if (name.startsWith('@')) {
    return name;
  }
  return `@appsemble/${name}`;
}

/**
 * Filter blocks unique by their type and version.
 *
 * @param {Object[]} blocks Input blocks.
 * @returns {Object[]} Partial unique blocks. Only the type and version are returned.
 */
export function filterBlocks(blocks) {
  const visited = new Set();
  const result = [];

  blocks.forEach(({ type, version }) => {
    const name = normalizeBlockName(type);
    const asString = `${name}@${version}`;
    if (!visited.has(asString)) {
      result.push({ type: name, version });
    }
    visited.add(asString);
  });
  return result;
}
