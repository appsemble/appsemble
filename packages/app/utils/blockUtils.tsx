import { Block } from '@appsemble/types';

export function normalizeBlockName(name: string): string {
  if (name.startsWith('@')) {
    return name;
  }
  return `@appsemble/${name}`;
}

export function blockToString({ type, version }: Block): string {
  return `${normalizeBlockName(type)}@${version}`;
}

export function prefixURL(block: Block, url: string): string {
  return `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}/${url}`;
}
