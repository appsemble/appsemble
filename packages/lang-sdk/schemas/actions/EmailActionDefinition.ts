import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

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
    from: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The name of the sender of the email.',
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
      description: `The attachments to include in the email.

The remapper must resolve to an object containing the following properties:

- \`target\`: The asset ID or link to download contents from to add as an attachment. This is mutually exclusive with \`content\`.
- \`content\`: The raw content to include as the file content. This is mutually exclusive with \`target\`.
- \`filename\`: The filename to include the attachment as.
- \`accept\` If the target is a URL, this will be set as the HTTP \`Accept\` header when downloading the file.

If the attachment is a string, it will be treated as the target.`,
    },
  },
});
