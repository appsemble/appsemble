import { createGetAppGroupsController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const getAppGroups = createGetAppGroupsController(options);
