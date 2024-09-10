import { createProxyPatch } from '@appsemble/node-utils';

import { options } from '../../../options/options.js';

export const proxyPatch = createProxyPatch(options);
