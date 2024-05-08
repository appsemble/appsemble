import { type BaseActionDefinition } from '@appsemble/types';

import { type ServerActionParameters } from './index.js';

export function throwAction({ data }: ServerActionParameters<BaseActionDefinition<'throw'>>): any {
  throw data;
}
