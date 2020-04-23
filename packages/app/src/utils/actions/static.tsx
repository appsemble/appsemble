// static is a reserved keyword.
// eslint-disable-next-line filenames/match-exported
import type { BaseAction } from '@appsemble/sdk';
import type { StaticActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';

export default function staticAction({
  definition: { value },
}: MakeActionParameters<StaticActionDefinition>): BaseAction<'static'> {
  return {
    type: 'static',
    dispatch() {
      return value;
    },
  };
}
