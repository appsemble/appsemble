import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const NotifyActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'title', 'body', 'to'],
  properties: {
    type: {
      enum: ['notify'],
      description: 'Send notifications to one or all the users of an app.',
    },
    title: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The title of the notification.',
    },
    body: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The description of the notification.',
    },
    to: {
      anyOf: [{ enum: ['all'] }, { $ref: '#/components/schemas/RemapperDefinition' }],
      description: `To whom the notification should be sent.

Use \`all\` to send the notification to all app subscribed users.
Otherwise you can pass the users id using remappers to notify a specific user.

Nothing is sent if the value is **not** a valid user id.
`,
    },
  },
});
