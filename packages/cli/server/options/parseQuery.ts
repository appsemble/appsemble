import {ParsedQuery, ParseQueryParams} from '@appsemble/node-utils/server/types.js';

export const parseQuery = ({ $filter, $orderby }: ParseQueryParams): ParsedQuery => {
  console.log('FILTER', $filter)
  console.log('ORDERBY', $orderby)
  return {
    where: {},
    order: null,
  };
};
