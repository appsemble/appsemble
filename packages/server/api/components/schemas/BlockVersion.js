export default {
  type: 'object',
  description: `A version of a block definition

    Block versions can’t be updated or deleted. This ensures apps that use a block version can never
    be broken by alterations of block definitions.
  `,
  required: ['version'],
  properties: {
    block: {
      $ref: '#/components/schemas/BlockDefinition/properties/id',
      description: 'The id of the block definition to which this version applies.',
    },
    version: {
      type: 'string',
      pattern: /^\d+\.\d+\.\d+$/,
      description: 'A [semver](https://semver.org) representation of the block version.',
    },
    layout: {
      description: `How the block will be displayed on the screen.

        - **\`float\`**: The block will float somewhere on the screen.
        - **\`grow\`**: The block will be positioned in the main page. It will grow to fill up
          remaining space on the page.
        - **\`static\`**: The block will be positioned in the main page. It will take up a fixed
          amount of space.
      `,
      default: 'grow',
      enum: ['float', 'grow', 'static'],
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
    resources: {
      type: 'object',
      description: 'deprecated',
      additionalProperties: true,
    },
    files: {
      type: 'array',
      readOnly: true,
      description: 'A list of file assets that belong to the app version.',
      items: {
        type: 'string',
      },
    },
  },
};
