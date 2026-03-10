import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  type CreateSettingsParams,
  createSettings as createUtilsSettings,
} from '@appsemble/node-utils';

import { getProjectBuildConfig } from '../../lib/config.js';
import { buildProject, makeProjectPayload } from '../../lib/project.js';

export async function createSettings({
  context,
  host,
  languages,
}: CreateSettingsParams): Promise<[digest: string, script: string]> {
  const { appBlocks, appPath, appsembleApp } = context;

  const controllerPath = join(appPath, 'controller');

  let controllerCode;
  let controllerImplementations;

  if (existsSync(controllerPath)) {
    const controllerBuildConfig = await getProjectBuildConfig(controllerPath);

    const controllerBuildResult = await buildProject(controllerBuildConfig);
    [, controllerImplementations] = await makeProjectPayload(controllerBuildConfig);

    controllerCode = controllerBuildResult.outputFiles?.[0].text;
  }

  return createUtilsSettings({
    apiUrl: host,
    appControllerCode: controllerCode,
    appControllerImplementations: JSON.stringify(controllerImplementations),
    blockManifests: appBlocks,
    id: appsembleApp.id,
    languages,
    definition: appsembleApp.definition,
    appUpdated: appsembleApp.$updated,
    logins: [],
    development: true,
    supportedLanguages: ['en'],
  });
}
