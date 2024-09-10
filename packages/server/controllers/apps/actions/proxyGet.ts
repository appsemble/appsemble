import { createProxyGet } from '@appsemble/node-utils';

import { options } from '../../../options/options.js';

export const proxyGet = createProxyGet(options);
