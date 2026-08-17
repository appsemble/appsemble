import {
  type AppStyles,
  type GetAppSubEntityParams,
  replaceAssetFunctions,
} from '@appsemble/node-utils';

export function getAppStyles({ context }: GetAppSubEntityParams): Promise<AppStyles> {
  const { apiUrl, appsembleApp } = context;
  const { coreStyle = '', id, sharedStyle = '' } = appsembleApp;

  return Promise.resolve({
    coreStyle: replaceAssetFunctions(coreStyle, id, apiUrl),
    sharedStyle: replaceAssetFunctions(sharedStyle, id, apiUrl),
  });
}
