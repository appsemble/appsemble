import { createProxyPutController } from '@appsemble/node-utils';

import { options } from '../../../options/options.js';

export const proxyPut = createProxyPutController(options);
