import { identity } from '@appsemble/utils';

import { type ActionCreator } from './index.js';

export const noop: ActionCreator<'noop'> = () => [identity];
