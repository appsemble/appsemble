import { type OpenAPIV3 } from 'openapi-types';

export const $select: OpenAPIV3.ParameterObject = {
  name: '$select',
  in: 'query',
  description: `
    The OData \`$select\` query option.

    This is a comma separated string of fields to select. Only filtering flat properties is
    supported.

    http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_SystemQueryOptionselect
  `,
  schema: { type: 'string' },
};
