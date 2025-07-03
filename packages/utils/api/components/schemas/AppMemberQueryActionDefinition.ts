import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const AppMemberQueryActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['app.member.query'],
      description: `Allows the currently logged in app member to fetch a list of app members by their roles.

Does nothing if the app member isn’t logged in.`,
    },
    roles: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The roles of the app members that would be fetched.',
    },
    query: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'Additional filters to fetch members based on properties and other fields',
    },
  },
});
