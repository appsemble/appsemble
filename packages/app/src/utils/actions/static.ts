import { BaseAction } from '@appsemble/sdk';
import { StaticActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export function staticAction({
  definition: { value },
}: MakeActionParameters<StaticActionDefinition>): BaseAction<'static'> {
  return {
    type: 'static',
    dispatch() {
      return value;
    },
  };
}
