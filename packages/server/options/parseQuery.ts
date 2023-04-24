import { ParsedQuery, ParseQueryParams } from '@appsemble/node-utils/server/types.js';

import { parseQuery as parseQueryServer } from '../utils/resource.js';

export const parseQuery = (parseQueryParams: ParseQueryParams): ParsedQuery => {
  const parsed = parseQueryServer(parseQueryParams);
  return {
    where: parsed.query as Pick<ParsedQuery, 'where'>,
    order: parsed.order,
  };
};
