import { createProxyDeleteController } from '@appsemble/node-utils';

import { options } from '../../../options/options.js';

export const proxyDelete = createProxyDeleteController(options);
