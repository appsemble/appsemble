import { type OpenAPIV3 } from 'openapi-types';

export const SubscriptionPlan: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A subscription plan organizations can subscribe to.',
  readOnly: true,
  additionalProperties: false,
  required: [
    'name',
    'price',
    'appLimit',
    'dailyNotifications',
    'persistentStorage',
    'customContainers',
    'sla',
    'blocks',
    'backend',
  ],
  properties: {
    name: {
      enum: ['free', 'basic', 'standard', 'extensive', 'enterprise'],
      description: 'The name of the subscription plan.',
    },
    price: {
      type: 'string',
      description: 'The monthly price in euros, excluding VAT.',
    },
    appLimit: {
      anyOf: [{ type: 'integer' }, { enum: ['unlimited'] }],
      description: 'How many public apps the organization can publish.',
    },
    dailyNotifications: {
      anyOf: [{ type: 'integer' }, { enum: ['unlimited'] }],
      description: 'How many notifications the organization can send daily from our SMTP server.',
    },
    persistentStorage: {
      type: 'number',
      description: 'How many GB of data the organization can store on our servers.',
    },
    customContainers: {
      type: 'boolean',
      description: 'Whether the organization can use custom containers.',
    },
    sla: {
      type: 'string',
      description: 'The service level agreement associated with the plan.',
    },
    blocks: {
      type: 'string',
      description: 'The level of block support included in the plan.',
    },
    backend: {
      type: 'string',
      description: 'The type of backend support included in the plan.',
    },
  },
};
