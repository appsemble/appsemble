import { GetAppLanguagesParams } from '@appsemble/node-utils/types';

export const getAppLanguages = ({ context }: GetAppLanguagesParams): Promise<string[]> =>
  Promise.resolve(context.appMessages.map((messages) => messages.language));
