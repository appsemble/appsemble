import { GetAppLanguagesParams } from 'packages/node-utils/server/routes/types';

export const getAppLanguages = ({ context }: GetAppLanguagesParams): Promise<string[]> =>
  Promise.resolve(context.appMessages.map((messages) => messages.language));
