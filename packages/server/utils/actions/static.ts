import { StaticActionDefinition } from '@appsemble/types';

import { ServerActionParameters } from './index.js';

export function staticAction({ action }: ServerActionParameters<StaticActionDefinition>): any {
  return action.value;
}
