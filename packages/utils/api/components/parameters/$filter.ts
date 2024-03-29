import { type OpenAPIV3 } from 'openapi-types';

export const $filter: OpenAPIV3.ParameterObject = {
  name: '$filter',
  in: 'query',
  description: `
    An OData filter

    http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_SystemQueryOptionfilter
  `,
  schema: { type: 'string' },
};
