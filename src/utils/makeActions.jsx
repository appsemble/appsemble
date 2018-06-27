import normalize from './normalize';


const actionCreators = {
  link(definition, block, history) {
    const href = `/${normalize(definition.to)}`;

    return {
      dispatch() {
        history.push(href);
      },
      href,
    };
  },
};


export default function makeActions(blockDef, block, history) {
  return Object.entries(blockDef.actions || {})
    .reduce((acc, [on, { required }]) => {
      if (Object.prototype.hasOwnProperty.call(block.actions, on)) {
        const definition = block.actions[on];
        const actionCreator = actionCreators[definition.type];
        const action = actionCreator(definition, block, history);
        action.type = definition.type;
        acc[on] = action;
      } else if (required) {
        throw new Error(`Missing required action ${on}`);
      }
      return acc;
    }, {});
}
