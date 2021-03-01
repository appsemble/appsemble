// eslint-disable-next-line import/no-extraneous-dependencies
import { Heading, Root } from 'mdast';
import { Attacher } from 'unified';

function transformer(ast: Root): void {
  ast.children.forEach((node: Heading) => {
    if (node.type === 'heading' && node.depth === 1) {
      ast.children.push({
        type: 'export',
        value: `export const title = ${JSON.stringify(node.children[0].value)};`,
      } as any);
    }
  });
}

/**
 * This remark plugin will create an MDX named title export for each level 1 markdown heading.
 */
export const remarkHeading: Attacher = () => transformer;
