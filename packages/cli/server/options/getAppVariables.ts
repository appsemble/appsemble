import { type GetAppSubEntityParams } from '@appsemble/node-utils';
import { type AppConfigEntry as AppVariableInterface } from '@appsemble/types';

export function getAppVariables({
  context,
}: GetAppSubEntityParams): Promise<AppVariableInterface[]> {
  return Promise.resolve(context.appVariables);
}
