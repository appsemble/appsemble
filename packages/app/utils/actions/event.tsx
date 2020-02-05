import { BaseAction, EventActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export default function event({
  definition,
  ee,
}: MakeActionParameters<EventActionDefinition>): BaseAction<'event'> {
  const { name } = definition;

  return {
    type: 'event',
    async dispatch(data) {
      ee.emit(name, data);
    },
  };
}
