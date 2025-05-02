import { type GetAppVariablesParams } from '@appsemble/node-utils';
import { type AppConfigEntry as AppVariableInterface } from '@appsemble/types';

import { getAppDB } from '../models/index.js';

export async function getAppVariables({
  app,
  query,
}: GetAppVariablesParams): Promise<AppVariableInterface[]> {
  const { AppVariable } = await getAppDB(app.id!);
  const appVariables = await AppVariable.findAll(query);
  return appVariables.map((appVariable) => appVariable.toJSON());
}
