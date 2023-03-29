import { createSettings as createUtilsSettings } from '@appsemble/node-utils';
import { CreateSettingsParams } from 'packages/node-utils/server/routes/types';

export const createSettings = ({
  context,
  host,
  languages,
}: CreateSettingsParams): Promise<[digest: string, script: string]> => {
  const { appBlocks, appsembleApp } = context;

  return Promise.resolve(
    createUtilsSettings({
      apiUrl: host,
      blockManifests: appBlocks,
      id: appsembleApp.id,
      languages,
      definition: appsembleApp.definition,
      appUpdated: appsembleApp.$updated,
    }),
  );
};
