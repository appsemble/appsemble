import { createDeleteAppResourceController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const deleteAppResource = createDeleteAppResourceController(options);
