import { GetAppMessagesParams } from '@appsemble/node-utils/types';
import { AppMessages } from '@appsemble/types';

export const getAppMessages = ({
  context,
  language,
}: GetAppMessagesParams): Promise<AppMessages> => {
  const { appMessages } = context;

  return Promise.resolve(appMessages.find((messages) => messages.language === language));
};
