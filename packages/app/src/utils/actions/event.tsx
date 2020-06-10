import type { BaseAction } from '@appsemble/sdk';
import type { EventActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';

export default function event({
  definition,
  ee,
}: MakeActionParameters<EventActionDefinition>): BaseAction<'event'> {
  const { event: eventName } = definition;

  return {
    type: 'event',
    async dispatch(data) {
      ee.emit(eventName, data);
      return data;
    },
  };
}
