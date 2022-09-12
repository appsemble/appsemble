import { identity } from '@appsemble/utils';

import { ActionCreator } from './index.js';

export const noop: ActionCreator<'noop'> = () => [identity];
