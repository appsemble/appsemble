import {
  type OrderItem,
  type ParsedQuery,
  type ParseQueryParams,
  type WhereOptions,
} from '@appsemble/node-utils';

import { parseQuery as parseQueryServer } from '../utils/resource.js';

export function parseQuery(parseQueryParams: ParseQueryParams): ParsedQuery {
  const parsed = parseQueryServer(parseQueryParams);
  return {
    where: parsed.query as WhereOptions,
    order: parsed.order as OrderItem[],
  };
}
