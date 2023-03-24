import { createSettings as createUtilsSettings } from '@appsemble/node-utils';
import { CreateSettingsParams } from '@appsemble/node-utils/types';

import { makePayload } from '../../../lib/block.js';

export const createSettings = async ({
  context,
  languages,
}: CreateSettingsParams): Promise<[digest: string, script: string]> => {
  const { apiUrl, appBlocks, appsembleApp, blockConfigs } = context;

  const blockPromises = appBlocks.map(async (appBlock) => {
    const blockConfig = blockConfigs.find((config) => config.name === appBlock.type);
    const [, blockData] = await makePayload(blockConfig);
    return { ...blockData };
  });

  const blocks = await Promise.all(blockPromises);

  const blockManifestPromises = blocks.map((block) => ({
    name: block.name,
    version: block.version,
    layout: block.layout,
    actions: block.actions,
    events: block.events,
    files: block.files,
  }));

  const blockManifests = await Promise.all(blockManifestPromises);

  return createUtilsSettings({
    apiUrl,
    blockManifests,
    id: appsembleApp.id,
    languages,
    definition: appsembleApp.definition,
    appUpdated: appsembleApp.$updated,
  });
};
