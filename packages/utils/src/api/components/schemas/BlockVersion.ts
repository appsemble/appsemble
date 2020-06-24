import { partialNormalized, semver } from '../../../constants';

export default {
  type: 'object',
  description: `A version of a block definition

    Block versions can’t be updated or deleted. This ensures apps that use a block version can never
    be broken by alterations of block definitions.
  `,
  required: ['name', 'version', 'files'],
  properties: {
    name: {
      type: 'string',
      readOnly: true,
      description: `The name of a block.

        This uses the same form as scoped npm packages. For example, \`@appsemble/form\`.
      `,
      pattern: `^@${partialNormalized.source}/${partialNormalized.source}$`,
    },
    description: {
      type: 'string',
      description: 'The description of the block.',
    },
    longDescription: {
      type: 'string',
      description: 'The long description of the block.',
    },
    icon: {
      type: 'string',
      format: 'binary',
      description: 'An icon to represent the block in Appsemble studio.',
    },
    iconUrl: {
      type: 'string',
      format: 'uri',
      description: 'The relative URL on which the icon is served',
      readOnly: true,
    },
    version: {
      type: 'string',
      pattern: semver.source,
      description: 'A [semver](https://semver.org) representation of the block version.',
    },
    layout: {
      type: 'string',
      description: `How the block will be displayed on the screen.

        - **\`float\`**: The block will float somewhere on the screen.
        - **\`grow\`**: The block will be positioned in the main page. It will grow to fill up
          remaining space on the page.
        - **\`static\`**: The block will be positioned in the main page. It will take up a fixed
          amount of space.
        - **\`hidden\`**: The block will not be rendered at all.
      `,
      default: 'grow',
      enum: ['float', 'grow', 'static', 'hidden'],
    },
    actions: {
      type: 'object',
      description: `An object which describes the actions a block can trigger.

        This will be used to validate app definitions.
      `,
      additionalProperties: true,
    },
    parameters: {
      type: 'object',
      description: `A draft 7 JSON schema to use for block parameter validation.

        If the parameters of a block definition don’t conform to this schema, the app definition
        will be considered invalid.
      `,
    },
    events: {
      type: 'object',
      description: 'An object describing the names of the events the block can listen and emit to.',
      properties: {
        listen: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { description: { type: 'string' } } },
        },
        emit: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { description: { type: 'string' } } },
        },
      },
    },
    resources: {
      type: 'object',
      description: 'deprecated',
      additionalProperties: true,
    },
    files: {
      type: 'array',
      description: 'A list of file assets that belong to the app version.',
      minLength: 1,
      items: {
        type: 'string',
        format: 'binary',
      },
    },
  },
};
