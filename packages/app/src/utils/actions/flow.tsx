import type { BaseAction } from '@appsemble/sdk';
import type { BaseActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';

// See Page.jsx
export function next({
  flowActions,
}: MakeActionParameters<BaseActionDefinition<'flow.next'>>): BaseAction<'flow.next'> {
  return {
    type: 'flow.next',
    // eslint-disable-next-line require-await
    async dispatch(data) {
      return flowActions.next(data);
    },
  };
}

export function finish({
  flowActions,
}: MakeActionParameters<BaseActionDefinition<'flow.finish'>>): BaseAction<'flow.finish'> {
  return {
    type: 'flow.finish',
    // eslint-disable-next-line require-await
    async dispatch(data) {
      return flowActions.finish(data);
    },
  };
}

export function back({
  flowActions,
}: MakeActionParameters<BaseActionDefinition<'flow.back'>>): BaseAction<'flow.back'> {
  return {
    type: 'flow.back',
    // eslint-disable-next-line require-await
    async dispatch(data) {
      return flowActions.back(data);
    },
  };
}

export function cancel({
  flowActions,
}: MakeActionParameters<BaseActionDefinition<'flow.cancel'>>): BaseAction<'flow.cancel'> {
  return {
    type: 'flow.cancel',
    // eslint-disable-next-line require-await
    async dispatch(data) {
      return flowActions.cancel(data);
    },
  };
}
