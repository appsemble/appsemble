import { LogAction } from '@appsemble/sdk';

import { ActionDefinition, MakeActionParameters } from '../../types';

interface LogActionDefinition extends ActionDefinition<'log'> {
  level: LogAction['level'];
}

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
