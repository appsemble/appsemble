import { AppStyles, GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

export const getAppStyles = ({ context }: GetAppSubEntityParams): Promise<AppStyles> =>
  Promise.resolve({
    coreStyle: context.appsembleApp.coreStyle,
    sharedStyle: context.appsembleApp.sharedStyle,
  });
