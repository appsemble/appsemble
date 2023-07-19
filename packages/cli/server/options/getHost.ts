import { type GetHostParams } from '@appsemble/node-utils';

export function getHost({ context }: GetHostParams): string {
  const { apiUrl } = context;
  return apiUrl;
}
