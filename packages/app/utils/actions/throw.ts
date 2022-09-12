import { rethrow } from '@appsemble/utils';

import { ActionCreator } from './index.js';

export const throwAction: ActionCreator<'throw'> = () => [rethrow];
