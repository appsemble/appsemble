import { BaseAction, EventActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export default function event({
  definition,
  emit,
}: MakeActionParameters<EventActionDefinition>): BaseAction<'event'> {
  const { name } = definition;

  return {
    type: 'event',
    async dispatch(data) {
      emit(name, data);
    },
  };
}
