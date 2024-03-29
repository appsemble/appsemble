import { type ActionCreator } from './index.js';
import { createAction } from '../makeActions.js';

export const match: ActionCreator<'match'> = ({
  definition,
  prefix,
  prefixIndex,
  remap,
  ...params
}) => {
  const caseActions = definition.match.map((c, i) =>
    createAction({
      ...params,
      definition: c.action,
      prefix: `${prefix}.match.${i}.action`,
      prefixIndex: `${prefixIndex}.match.${i}.action`,
      remap,
    }),
  );

  return [
    (data: unknown, context) => {
      const action = caseActions.find((c, i) => remap(definition.match[i].case, data));
      if (action == null) {
        return data;
      }
      return action(data, context);
    },
  ];
};
