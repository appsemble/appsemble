import { createAction } from '../makeActions.js';
import { ActionCreator } from './index.js';

export const each: ActionCreator<'each'> = ({ definition, prefix, prefixIndex, ...params }) => {
  const doAction = createAction({
    ...params,
    definition: definition.do,
    prefix: `${prefix}.do`,
    prefixIndex: `${prefixIndex}.do`,
  });

  return [
    (data: unknown, context) => {
      const entries = Array.isArray(data) ? data : [data];

      return Promise.all(entries.map((entry) => doAction(entry, context)));
    },
  ];
};
