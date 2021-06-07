import { Remapper, RequestLikeActionDefinition } from '@appsemble/types';
import { AxiosRequestConfig } from 'axios';

export function formatRequestAction(
  { method = 'GET', query, ...action }: RequestLikeActionDefinition,
  data: unknown,
  remap: (remapper: Remapper, data: any, context: Record<string, unknown>) => any,
  context: Record<string, unknown>,
): AxiosRequestConfig {
  return {
    method,
    url: String(remap(action.url, data, context)),
    headers: {},
    params: remap(query, data, context),
  };
}
