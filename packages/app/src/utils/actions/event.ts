import { BaseAction } from '@appsemble/sdk';
import { EventActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export function event({
  definition,
  ee,
}: Pick<MakeActionParameters<EventActionDefinition>, 'definition' | 'ee'>): BaseAction<'event'> {
  const { event: eventName, waitFor } = definition;

  return {
    type: 'event',
    // eslint-disable-next-line require-await
    async dispatch(data) {
      ee.emit(eventName, data);
      return waitFor
        ? new Promise((resolve, reject) => {
            ee.once(waitFor, (response, error) => (error ? reject(error) : resolve(response)));
          })
        : data;
    },
  };
}
