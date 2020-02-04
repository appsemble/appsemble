import { IdentifiableBlock, normalizeBlockName } from '@appsemble/utils';

import settings from './settings';

export default function prefixBlockURL(block: IdentifiableBlock, url: string): string {
  return `${settings.apiUrl}/api/blocks/${normalizeBlockName(block.type)}/versions/${
    block.version
  }/${url}`;
}
