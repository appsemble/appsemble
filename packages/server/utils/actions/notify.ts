import { getRemapperContext } from '@appsemble/node-utils';
import { type NotifyActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';

import { type ServerActionParameters } from './index.js';

export async function notify({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<NotifyActionDefinition>): Promise<any> {
  const { sendNotifications } = options;

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );

  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });

  const to = remap(action.to, data, remapperContext) as string;
  const title = remap(action.title, data, remapperContext) as string;
  const body = remap(action.body, data, remapperContext) as string;

  await sendNotifications({ app: app.toJSON(), to, title, body });

  return data;
}
