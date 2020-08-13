import type { BlockDefinition } from '@appsemble/types';

export type IdentifiableBlock = Pick<BlockDefinition, 'type' | 'version'>;

const prefix = '@appsemble/';

/**
 * Normalize a block name by prefixing it with `@appsemble` if necessary.
 *
 * @param name - The input block name.
 * @returns The normalized block name.
 */
export function normalizeBlockName(name: string): string {
  if (name.startsWith('@')) {
    return name;
  }
  return `${prefix}${name}`;
}

/**
 * Return a block name without the organization prefix.
 *
 * @param name - The input block name.
 * @returns The prettified block name.
 */
export function stripBlockName(name: string): string {
  if (name.startsWith(prefix)) {
    return name.slice(prefix.length);
  }
  return name;
}

/**
 * Filter blocks unique by their type and version.
 *
 * @param blocks - Input blocks.
 * @returns Partial unique blocks. Only the type and version are returned.
 */
export function filterBlocks(blocks: IdentifiableBlock[]): IdentifiableBlock[] {
  const visited = new Set();
  const result: IdentifiableBlock[] = [];

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
