import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type AppConfigEntry as AppVariableInterface } from '@appsemble/types';

import { AppVariable } from '../models/index.js';

export async function getAppVariables({
  app,
}: GetAppSubEntityParams): Promise<AppVariableInterface[]> {
  const appVariables = await AppVariable.findAll({
    where: {
      AppId: app.id,
    },
  });
  return appVariables.map((appVariable) => appVariable.toJSON());
}
