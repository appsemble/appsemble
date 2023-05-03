import { type GetHostParams } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';

export function getHost({ context }: GetHostParams): string {
  const { appsembleApp } = context;
  const prefix = `${normalize(appsembleApp.definition.name)}.`;
  return context.appHost.replace(prefix, '');
}
