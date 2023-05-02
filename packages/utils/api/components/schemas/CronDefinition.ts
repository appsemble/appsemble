import { type OpenAPIV3 } from 'openapi-types';

export const CronDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  required: ['schedule'],
  description: 'A cron definition defines tasks that Appsemble will run periodically for the app.',
  additionalProperties: false,
  properties: {
    schedule: {
      description: `A crontab string to define when the action should be run.

See [Crontab guru](https://crontab.guru) for details
`,
      type: 'string',
    },
    action: {
      description: 'The action to run when the cronjob is triggered.',
      $ref: '#/components/schemas/ActionDefinition',
    },
  },
};
