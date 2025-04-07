import { defaultLocale, remap } from '@appsemble/lang-sdk';
import { getRemapperContext } from '@appsemble/node-utils';
import { type ConditionActionDefinition } from '@appsemble/types';

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
  // XXX: what's going on here
  //
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return handleAction(implementation, {
    app,
    action: actionDefinition,
    data,
    options,
    context,
    ...params,
  });
}
