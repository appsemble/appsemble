import { OpenAPIV3 } from 'openapi-types';

export const TeamsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'This defines how teams are handled by an app.',
  required: ['join', 'invite'],
  properties: {
    join: {
      enum: ['anyone', 'invite'],
      description:
        'If this is set to `anyone`, any logged in user may join a team. If this is set to `invite`, only users may join who have been invited.',
    },
    create: {
      type: 'array',
      description: `A list of app roles which may create a team.

By default teams can only be created from Appsemble Studio.`,
      items: { type: 'string' },
      default: [],
    },
    invite: {
      type: 'array',
      description: `The roles here determine which users may invite a team member.

The special roles \`$team:member\` and \`$team:manager\` mean that users who are already member of manager of the team may also invite new members.`,
      items: { type: 'string' },
    },
  },
};
