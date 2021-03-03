// eslint-disable-next-line import/no-extraneous-dependencies
import { Image, Root } from 'mdast';
import { Attacher } from 'unified';
import visit from 'unist-util-visit';

function transformer(ast: Root): void {
  const images: any[] = [];
  visit<Image>(ast, { type: 'image' }, (node, index, parent) => {
    const identifier = `__image_${images.length}__`;
    images.push({
      type: 'mdxjsEsm',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          comments: [],
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: identifier },
                },
              ],
              source: {
                type: 'Literal',
                value: node.url,
              },
            },
          ],
        },
      },
    });
    // eslint-disable-next-line no-param-reassign
    parent.children[index] = {
      type: 'mdxJsxFlowElement',
      name: 'img',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'alt', value: node.alt },
        {
          type: 'mdxJsxAttribute',
          name: 'src',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            data: {
              estree: {
                type: 'Program',
                sourceType: 'module',
                comments: [],
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: { type: 'Identifier', name: identifier },
                  },
                ],
              },
            },
          },
        },
      ],
      children: [],
    };
  });
  ast.children.unshift(...images);
}

/**
 * This remark plugin will convert any markdown images into MDX image tags using ESM imports.
 *
 * This means Webpack will be able to resolve any Markdown images.
 */
export const remarkImages: Attacher = () => transformer;
