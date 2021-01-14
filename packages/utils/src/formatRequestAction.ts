import { Remapper, RequestLikeActionDefinition } from '@appsemble/types';
import { AxiosRequestConfig } from 'axios';

export function formatRequestAction(
  { method = 'GET', query, ...action }: RequestLikeActionDefinition,
  data: unknown,
  remap: (remapper: Remapper, data: any) => any,
): AxiosRequestConfig {
  return {
    method,
    url: String(remap(action.url, data)),
    headers: {},
    params: remap(query, data),
  };
}
