import { BaseAction } from '@appsemble/sdk';
import { EventActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export default function event({
  definition,
  ee,
}: MakeActionParameters<EventActionDefinition>): BaseAction<'event'> {
  const { event: eventName } = definition;

  return {
    type: 'event',
    async dispatch(data) {
      ee.emit(eventName, data);
    },
  };
}
