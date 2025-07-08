import { type StaticActionDefinition } from '@appsemble/lang-sdk';

import { type ServerActionParameters } from './index.js';

export function staticAction({ action }: ServerActionParameters<StaticActionDefinition>): any {
  return action.value;
}
