import { createCreateAppResourceController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const createAppResource = createCreateAppResourceController(options);
