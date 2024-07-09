import { type OpenAPIV3 } from 'openapi-types';

export const ContainerDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'An object describing a companion container',

  required: ['name', 'image', 'port'],
  properties: {
    name: {
      type: 'string',
      description: 'Alias used to reference the container',
    },
    image: {
      type: 'string',
      description: 'Name of the image used for the container',
    },
    port: {
      type: 'number',
      description: 'Port used by the image provided',
    },
    resources: {
      type: 'object',
      additionalProperties: true,
      description:
        'Maximum amount of resources the container can use. Deafult: 1 CPU and 512Mi memory',
    },
    env: {
      type: 'array',
      description: 'Environment variables that will be used within the container',
      items: {
        type: 'object',
        additionalProperties: false,
        description:
          'Each item is an environment variable. `useValueFromSecret` property determines whether the value is taken literally or from and existing secret',
        required: ['name', 'value'],
        properties: {
          name: { type: 'string', description: 'Name of the environment variable' },
          useValueFromSecret: {
            type: 'boolean',
            description:
              'If set to true, will retrieve the value from the Kubernetes secret, the value property will refer to the secret key. If false, will take the value literally',
          },
          value: {
            type: 'string',
            description:
              "The value of the environment variable. If `useValueFromSecret` is true, this property will refer to the Kubernetes secret's key",
          },
        },
      },
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Metadata including labels and annotations to be added to the container',
    },
  },
};
