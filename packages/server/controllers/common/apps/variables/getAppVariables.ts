import { createGetAppVariablesController } from '@appsemble/node-utils';

import { options } from '../../../../options/options.js';

export const getAppVariables = createGetAppVariablesController(options);
