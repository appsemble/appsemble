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
      handleAction(implementation, { ...params, action: actionDefinition, data: entry }),
    ),
  );
}
