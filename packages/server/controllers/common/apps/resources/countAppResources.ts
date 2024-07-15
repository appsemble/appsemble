import { createCountAppResourcesController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const countAppResources = createCountAppResourcesController(options);
