import { type AppStyles, type GetAppSubEntityParams } from '@appsemble/node-utils';

export function getAppStyles({ context }: GetAppSubEntityParams): Promise<AppStyles> {
  return Promise.resolve({
    coreStyle: context.appsembleApp.coreStyle,
    sharedStyle: context.appsembleApp.sharedStyle,
  });
}
