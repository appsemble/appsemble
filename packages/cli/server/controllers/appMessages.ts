import { createGetMessages } from '@appsemble/node-utils/server/controllers/appMessages.js';

import { options } from '../options/options.js';

export const getMessages = createGetMessages(options);
