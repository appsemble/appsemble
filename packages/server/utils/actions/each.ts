import { EachActionDefinition } from '@appsemble/types';

import { handleAction } from '../action.js';
import { actions, ServerActionParameters } from './index.js';

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
