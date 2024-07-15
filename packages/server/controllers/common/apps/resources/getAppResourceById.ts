import { createGetAppResourceByIdController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const getAppResourceById = createGetAppResourceByIdController(options);
