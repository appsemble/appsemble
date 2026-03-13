import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const WebhookActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'name'],
  properties: {
    type: {
      enum: ['webhook'],
      description: `Invoke a webhook defined in the app.

The webhook's action is executed server-side, allowing secure operations like
generating verification codes, sending emails, and modifying resources without
exposing sensitive logic to the client.

The user must have the \`$webhook:<webhookName>:invoke\` permission to call this action.
`,
    },
    name: {
      type: 'string',
      description: 'The name of the webhook to invoke. Must match a webhook defined in the app.',
    },
    body: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `A remapper for the webhook body.

If not specified, the raw input data is passed to the webhook.
`,
    },
  },
});
