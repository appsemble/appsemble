import { GetAppSubEntityParams } from '@appsemble/node-utils/server/types';
import { AppMessages } from '@appsemble/types';

export const getAppMessages = ({ context }: GetAppSubEntityParams): Promise<AppMessages[]> =>
  Promise.resolve(context.appMessages);
