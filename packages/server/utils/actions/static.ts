import { type StaticActionDefinition } from '@appsemble/types';

import { type ServerActionParameters } from './index.js';

export function staticAction({ action }: ServerActionParameters<StaticActionDefinition>): any {
  return action.value;
}
