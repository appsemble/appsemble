import { StaticActionDefinition } from '@appsemble/types';

import { ServerActionParameters } from '.';

export function staticAction({ action }: ServerActionParameters<StaticActionDefinition>): any {
  return action.value;
}
