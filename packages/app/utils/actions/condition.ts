import { type ActionCreator } from './index.js';
import { createAction } from '../makeActions.js';

export const condition: ActionCreator<'condition'> = ({
  definition,
  prefix,
  prefixIndex,
  remap,
  ...params
}) => {
  const thenAction = createAction({
    ...params,
    definition: definition.then,
    prefix: `${prefix}.then`,
    prefixIndex: `${prefixIndex}.then`,
    remap,
  });

  const elseAction = createAction({
    ...params,
    definition: definition.else,
    prefix: `${prefix}.else`,
    prefixIndex: `${prefixIndex}.else`,
    remap,
  });

  return [
    (data: unknown, context) => {
      const action = remap(definition.if, data) ? thenAction : elseAction;
      return action(data, context);
    },
  ];
};
