import { safeLoad } from 'js-yaml';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Root } from 'mdast';
import { Attacher } from 'unified';

function transformer(ast: Root): void {
  ast.children.forEach((node, index) => {
    if (node.type === 'yaml') {
      // eslint-disable-next-line no-param-reassign
      ast.children[index] = {
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
                  declarations: Object.entries(safeLoad(node.value)).map(([name, value]) => ({
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name },
                    init: { type: 'Literal', value },
                  })),
                },
              },
            ],
          },
        },
      } as any;
    }
  });
}

/**
 * This remark plugin exposes YAML frontmatter data as a named export called `meta`.
 */
export const remarkYaml: Attacher = () => transformer;
