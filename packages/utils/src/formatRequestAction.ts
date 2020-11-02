import { RequestLikeActionDefinition } from '@appsemble/types';
import { AxiosRequestConfig } from 'axios';

import { compileFilters, MapperFunction } from './legacyRemap';

const regex = /{(.+?)}/g;

type Mapper = Record<string, MapperFunction>;

export function formatRequestAction(
  { method = 'GET', query, url }: RequestLikeActionDefinition,
  data: unknown,
): AxiosRequestConfig {
  const urlMatch = url.match(regex);
  const urlMappers = urlMatch
    ?.map((match) => match.slice(1, -1))
    .reduce<Mapper>((acc, filter) => ({ ...acc, [filter]: compileFilters(filter) }), {});

  const queryMappers =
    query &&
    Object.entries(query).reduce<Record<string, Mapper>>((acc, [queryKey, queryValue]) => {
      const queryMatch = String(queryValue).match(regex);
      if (queryMatch) {
        acc[queryKey] = queryMatch
          .map((match) => match.slice(1, -1))
          .reduce((subAcc, filter) => ({ ...subAcc, [filter]: compileFilters(filter) }), {});
      }
      return acc;
    }, {});

  return {
    method,
    url: url.replace(regex, (_, filter) => urlMappers[filter](data)),
    headers: {},
    params:
      query &&
      Object.fromEntries(
        Object.entries(query).map(([key, value]) => {
          if (!queryMappers[key]) {
            return [key, value];
          }

          return [
            key,
            queryMappers[key]
              ? value.replace(regex, (_, filter) => queryMappers[key][filter](data))
              : value,
          ];
        }),
      ),
  };
}
