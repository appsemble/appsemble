import { ActionCreator } from '.';
import { createAction } from '../makeActions';

export const condition: ActionCreator<'condition'> = ({ definition, prefix, remap, ...params }) => {
  const thenAction = createAction({
    ...params,
    definition: definition.then,
    prefix: `${prefix}.then`,
    remap,
  });

  const elseAction = createAction({
    ...params,
    definition: definition.else,
    prefix: `${prefix}.else`,
    remap,
  });

  return [
    (data: unknown, context) => {
      const action = remap(definition.if, data) ? thenAction : elseAction;
      return action(data, context);
    },
  ];
};
