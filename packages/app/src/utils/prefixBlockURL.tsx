import { IdentifiableBlock, normalizeBlockName } from '@appsemble/utils';

export function prefixBlockURL(block: IdentifiableBlock, url: string): string {
  return `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}/${url}`;
}
