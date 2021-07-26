import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const EmailActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'subject', 'body'],
  properties: {
    type: {
      enum: ['email'],
      description: `The email action can be used to send emails via the Appsemble server.

If \`to\`, \`cc\`, and \`bcc\` all end up being empty, no emails will be sent but the action will still continue as normal.
`,
    },
    to: {
      $ref: '#/components/schemas/RemapperDefinition',
      description:
        'The address the email should be sent to. Can be either in the format of `test@example.com`, or `John Doe <test@example.com>`',
    },
    cc: {
      $ref: '#/components/schemas/RemapperDefinition',
      description:
        'The list of additional email addresses email should be sent to. Uses the same format as `to`. Every email address in the CC is visible to all recipients.',
    },
    bcc: {
      $ref: '#/components/schemas/RemapperDefinition',
      description:
        'The list of additional email addresses email should be sent to. Uses the same format as `to`. Email addresses in the BCC are hidden from other recipients.',
    },
    subject: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The subject of the email.',
    },
    body: {
      $ref: '#/components/schemas/RemapperDefinition',
      description:
        'The body of the email. The content of the body is converted to HTML using the Markdown syntax.',
    },
    attachments: {
      $ref: '#/components/schemas/RemapperDefinition',
      description:
        'Remapper for the attachments to include in the email. Must resolve into an array of either asset IDs that are associated with the same app, or absolute URLs.',
    },
  },
});
