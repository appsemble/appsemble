// eslint-disable-next-line import/no-extraneous-dependencies
import { Heading, Root } from 'mdast';
import { Attacher } from 'unified';

function transformer(ast: Root): void {
  ast.children.some((node: Heading) => {
    if (node.type === 'heading' && node.depth === 1) {
      ast.children.push({
        type: 'mdxjsEsm',
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            comments: [],
            body: [
              {
                type: 'ExportNamedDeclaration',
                specifiers: [],
                declaration: {
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: 'title' },
                      init: { type: 'Literal', value: node.children[0].value },
                    },
                  ],
                },
              },
            ],
          },
        },
      } as any);
      return true;
    }
  });
}

/**
 * This remark plugin will create an MDX named title export for each level 1 markdown heading.
 */
export const remarkHeading: Attacher = () => transformer;
