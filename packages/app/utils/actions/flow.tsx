import { BaseAction } from '@appsemble/sdk';

import { ActionDefinition, MakeActionParameters } from '../../types';

// See Page.jsx
function next({
  flowActions,
}: MakeActionParameters<ActionDefinition<'flow.next'>>): BaseAction<'flow.next'> {
  return {
    type: 'flow.next',
    async dispatch(data) {
      return flowActions.next(data);
    },
  };
}

function finish({
  flowActions,
}: MakeActionParameters<ActionDefinition<'flow.finish'>>): BaseAction<'flow.finish'> {
  return {
    type: 'flow.finish',
    async dispatch(data) {
      return flowActions.finish(data);
    },
  };
}

function back({
  flowActions,
}: MakeActionParameters<ActionDefinition<'flow.back'>>): BaseAction<'flow.back'> {
  return {
    type: 'flow.back',
    async dispatch(data) {
      return flowActions.back(data);
    },
  };
}

function cancel({
  flowActions,
}: MakeActionParameters<ActionDefinition<'flow.cancel'>>): BaseAction<'flow.cancel'> {
  return {
    type: 'flow.cancel',
    async dispatch(data) {
      return flowActions.cancel(data);
    },
  };
}

export default { next, finish, back, cancel };
