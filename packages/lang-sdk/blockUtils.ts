import { type AppDefinition, type BlockDefinition } from '@appsemble/types';

import { blockNamePattern } from './constants/index.js';
import { iterApp } from './iterApp.js';

export type IdentifiableBlock = Pick<BlockDefinition, 'type' | 'version'>;

const prefix = '@appsemble/';

/**
 * Normalize a block name by prefixing it with `@appsemble` if necessary.
 *
 * @param name The input block name.
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
 * @param name The input block name.
 * @returns The prettified block name.
 */
export function stripBlockName(name: string): string {
  if (name.startsWith(prefix)) {
    return name.slice(prefix.length);
  }
  return name;
}

/**
 * Parse a block name into a tuple of organization id and block id.
 *
 * @param name The block name to parse.
 * @returns A tuple containing the organization id and block id.
 */
export function parseBlockName(name: string): [string, string] | undefined {
  // TODO: should this not throw an error? Most call sites are not well-prepared for undefined.
  const match = blockNamePattern.exec(normalizeBlockName(name));
  if (match) {
    return match.slice(1, 3) as [string, string];
  }
}

/**
 * Find unique block types in an app.
 *
 * @param definition The app definition to find unique blocks for.
 * @returns Partial unique blocks. Only the type and version are returned.
 */
export function getAppBlocks(definition: AppDefinition): IdentifiableBlock[] {
  const visited = new Set();
  const result: IdentifiableBlock[] = [];

  iterApp(definition, {
    onBlock({ type, version }) {
      const name = normalizeBlockName(type);
      const asString = `${name}@${version}`;
      if (!visited.has(asString)) {
        result.push({ type: name, version });
      }
      visited.add(asString);
    },
  });

  return result;
}

export function prefixBlockURL(block: IdentifiableBlock, url: string): string {
  return `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}/${url}`;
}
