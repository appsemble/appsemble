import { BlockManifest } from '@appsemble/types';

import { BlockVersion } from '../models';

export function blockVersionToJson(blockVersion: BlockVersion): BlockManifest {
  const {
    BlockAssets,
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
  if (blockVersion.get('hasIcon')) {
    iconUrl = `/api/blocks/${blockName}/versions/${version}/icon`;
  } else if (blockVersion.Organization.get('hasIcon')) {
    iconUrl = `/api/organizations/${
      Organization.id
    }/icon?updated=${blockVersion.Organization.updated.toISOString()}`;
  }
  return {
    actions,
    description,
    events,
    files: BlockAssets.map((f) => f.filename),
    iconUrl,
    layout,
    longDescription,
    name: blockName,
    parameters,
    version,
  };
}
