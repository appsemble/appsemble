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
    position: {
      description: `Where the block will be positioned on the screen.

        - **null**: The block will be positioned in the main page.
        - **'float'**: The block will float somewhere on the screen.
      `,
      default: null,
      enum: [null, 'float'],
    },
    actions: {
      type: 'object',
      description: `An object which describes the actions a block can trigger.

        This will be used to validate app definitions.
      `,
      additionalProperties: true,
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
