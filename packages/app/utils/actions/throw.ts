import { rethrow } from '@appsemble/utils';

import { type ActionCreator } from './index.js';

export const throwAction: ActionCreator<'throw'> = () => [rethrow];
