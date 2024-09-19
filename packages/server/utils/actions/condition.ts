import { getRemapperContext } from '@appsemble/node-utils';
import { type ConditionActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { actions, type ServerActionParameters } from './index.js';
import { handleAction } from '../action.js';

export async function condition({
  action,
  app,
  context,
  data,
  options,
  ...params
}: ServerActionParameters<ConditionActionDefinition>): Promise<any> {
  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );

  const actionDefinition = remap(action.if, data, remapperContext) ? action.then : action.else;
  const implementation = actions[actionDefinition.type];
  return handleAction(implementation, {
    app,
    action: actionDefinition,
    data,
    options,
    context,
    ...params,
  });
}
