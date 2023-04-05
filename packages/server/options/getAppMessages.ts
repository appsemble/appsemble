import { GetAppSubEntityParams } from '@appsemble/node-utils/server/types';
import { AppMessages as AppMessagesInterface } from '@appsemble/types';

import { AppMessages } from '../models/AppMessages.js';

export const getAppMessages = ({ app }: GetAppSubEntityParams): Promise<AppMessagesInterface[]> =>
  AppMessages.findAll({
    attributes: ['language'],
    where: { AppId: app.id },
  });
