import { type GetAppVariablesParams } from '@appsemble/node-utils';
import { type AppConfigEntry as AppVariableInterface } from '@appsemble/types';

import { AppVariable } from '../models/index.js';

export async function getAppVariables({
  app,
  query,
}: GetAppVariablesParams): Promise<AppVariableInterface[]> {
  const appVariables = await AppVariable.findAll({
    where: {
      AppId: app.id,
    },
    ...query,
  });
  return appVariables.map((appVariable) => appVariable.toJSON());
}
