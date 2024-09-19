import { createDeleteAppSeedResourcesController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const deleteAppSeedResources = createDeleteAppSeedResourcesController(options);
