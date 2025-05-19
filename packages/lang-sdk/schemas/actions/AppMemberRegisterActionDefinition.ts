import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const AppMemberRegisterActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'email', 'password'],
  properties: {
    type: {
      enum: ['app.member.register'],
      description: `Allows the app member to register using an email address and a password.

Does nothing if the app member is already logged in.`,
    },
    password: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The password to log in with.',
    },
    email: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The email to log in with.',
    },
    name: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The full name of the app member.',
    },
    picture: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The image to use for the profile picture of the app member.',
    },
    properties: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `The custom properties for the app member.

Values will be validated based on \`members.properties\`, if defined in the app definition.`,
    },
    login: {
      type: 'boolean',
      description: 'Whether to login after registering.',
      default: true,
    },
  },
});
