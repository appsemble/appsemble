import { LogAction } from '@appsemble/sdk';
import { LogActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export default function log({ definition }: MakeActionParameters<LogActionDefinition>): LogAction {
  const { level = 'info' } = definition;

  return {
    type: 'log',
    async dispatch(data) {
      // eslint-disable-next-line no-console
      console[level](data);
    },
    level,
  };
}
