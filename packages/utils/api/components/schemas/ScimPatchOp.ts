import { type OpenAPIV3 } from 'openapi-types';

export const ScimPatchOp: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A SCIM patch operation',
  required: ['schemas', 'operations'],
  additionalProperties: true,
  properties: {
    schemas: {
      type: 'array',
      maxItems: 1,
      minItems: 1,
      items: {
        enum: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      },
    },
    operations: {
      type: 'array',
      description: 'Patch operations to apply to the resource',
      items: {
        anyOf: [
          {
            type: 'object',
            description: 'A SCIM patch single replace operation',
            additionalProperties: false,
            required: ['op', 'path', 'value'],
            properties: {
              op: { enum: ['add', 'replace'] },
              name: { type: 'string' },
              path: { type: 'string' },
              value: {},
            },
          },
          {
            type: 'object',
            description: 'A SCIM patch bulk replace operation',
            additionalProperties: false,
            required: ['op', 'path'],
            properties: {
              op: { enum: ['remove'] },
              path: { type: 'string' },
            },
          },
        ],
      },
    },
  },
};
