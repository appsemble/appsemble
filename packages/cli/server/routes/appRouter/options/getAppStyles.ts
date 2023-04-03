import { AppStyles, GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

export const getAppStyles = ({ context }: GetAppSubEntityParams): Promise<AppStyles> =>
  Promise.resolve({
    coreStyle: context.appsembleApp.coreStyle,
    sharedStyle: context.appsembleApp.sharedStyle,
  });
