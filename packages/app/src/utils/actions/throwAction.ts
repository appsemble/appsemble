import { rethrow } from '@appsemble/utils';

import { ActionCreator } from '.';

export const throwAction: ActionCreator<'throw'> = () => [rethrow];
