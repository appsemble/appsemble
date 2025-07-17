import { BasePageDefinition } from './BasePageDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const ContainerPageDefinition = extendJSONSchema(BasePageDefinition, {
  type: 'object',
  additionalProperties: false,
  description: `Groups pages together under a collapsible parent page. Following is an example of
how this can be used:
\`\`\`yaml
pages:
  - name: Page 1
    type: container
    pages:
      - name: Contained page 1
        blocks:
          - type: action-button
            version: 0.29.8
            parameters:
              icon: git-alt
            actions:
              onClick:
                type: link
                to: Contained page 2
      - name: Contained page 2
        blocks:
          - type: action-button
            version: 0.29.8
            parameters:
              icon: git-alt
            actions:
              onClick:
                type: link
                to: Contained page 1
\`\`\`
`,
  required: ['type', 'pages'],
  properties: {
    type: {
      enum: ['container'],
    },
    pages: {
      type: 'array',
      minItems: 1,
      description: 'The pages of the app.',
      items: {
        anyOf: [
          { $ref: '#/components/schemas/PageDefinition' },
          { $ref: '#/components/schemas/TabsPageDefinition' },
          { $ref: '#/components/schemas/FlowPageDefinition' },
          { $ref: '#/components/schemas/LoopPageDefinition' },
          { $ref: '#/components/schemas/ContainerPageDefinition' },
        ],
      },
    },
  },
});
