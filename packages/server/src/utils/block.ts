import { BlockManifest } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';

import { BlockVersion } from '../models';

export function blockVersionToJson(blockVersion: BlockVersion): BlockManifest {
  const {
    BlockAssets,
    BlockMessages,
    Organization,
    actions,
    description,
    events,
    layout,
    longDescription,
    name,
    parameters,
    version,
  } = blockVersion;
  const blockName = `@${Organization.id}/${name}`;
  let iconUrl = null;
  if (blockVersion.icon || blockVersion.get('hasIcon')) {
    iconUrl = `/api/blocks/${blockName}/versions/${version}/icon`;
  } else if (blockVersion.Organization.icon || blockVersion.Organization.get('hasIcon')) {
    iconUrl = `/api/organizations/${Organization.id}/icon?${new URLSearchParams({
      updated: blockVersion.Organization.updated.toISOString(),
    })}`;
  }
  return {
    actions,
    description,
    events,
    files: BlockAssets.map((f) => f.filename).sort(compareStrings),
    iconUrl,
    layout,
    longDescription,
    name: blockName,
    parameters,
    version,
    languages: BlockMessages?.length
      ? BlockMessages.map((m) => m.language).sort(compareStrings)
      : null,
  };
}
