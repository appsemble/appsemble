import { createProxyPatchController } from '@appsemble/node-utils';

import { options } from '../../../options/options.js';

export const proxyPatch = createProxyPatchController(options);
