import { type OpenAPIV3 } from 'openapi-types';

export const $orderby: OpenAPIV3.ParameterObject = {
  name: '$orderby',
  in: 'query',
  description: `
    An OData query option to fetch ordered data

    https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_SystemQueryOptionorderby
  `,
  schema: { type: 'string' },
};
