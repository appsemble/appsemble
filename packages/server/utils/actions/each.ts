import { type EachActionDefinition } from '@appsemble/types';

import { actions, type ServerActionParameters } from './index.js';
import { handleAction } from '../action.js';

export function each({
  action,
  data,
  ...params
}: ServerActionParameters<EachActionDefinition>): Promise<any> {
  const entries = Array.isArray(data) ? data : [data];

  const actionDefinition = action.do;
  const implementation = actions[actionDefinition.type];

  return Promise.all(
    entries.map((entry) =>
      // XXX: what's going on here
      //
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      handleAction(implementation, { ...params, action: actionDefinition, data: entry }),
    ),
  );
}
