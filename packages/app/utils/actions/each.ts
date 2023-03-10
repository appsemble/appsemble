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
    async (data: unknown, context) => {
      const entries = Array.isArray(data) ? data : [data];

      if (definition.serial) {
        const results: unknown[] = [];
        for (const entry of entries) {
          const result = await doAction(entry, context);
          results.push(result);
        }
        return results;
      }
      return Promise.all(entries.map((entry) => doAction(entry, context)));
    },
  ];
};
