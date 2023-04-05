import { GetHostParams } from '@appsemble/node-utils/server/types';
import { normalize } from '@appsemble/utils';

export const getHost = ({ context }: GetHostParams): string => {
  const { appsembleApp } = context;
  const prefix = `${normalize(appsembleApp.definition.name)}.`;
  return context.appHost.replace(prefix, '');
};
