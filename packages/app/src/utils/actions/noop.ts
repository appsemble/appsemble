import { identity } from '@appsemble/utils';

import { ActionCreator } from '.';

export const noop: ActionCreator<'noop'> = () => [identity];
