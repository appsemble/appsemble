// eslint-disable-next-line import/no-extraneous-dependencies
import { Image, Root } from 'mdast';
import { Attacher } from 'unified';
import visit from 'unist-util-visit';

function transformer(ast: Root): void {
  const images: any[] = [];
  visit<Image>(ast, { type: 'image' }, (node, index, parent) => {
    const identifier = `__image_${images.length}__`;
    images.push({
      type: 'import',
      value: `import ${identifier} from ${JSON.stringify(node.url)}`,
    });
    // eslint-disable-next-line no-param-reassign
    parent.children[index] = {
      type: 'jsx',
      value: `<img alt=${JSON.stringify(node.alt)} src={${identifier}} />`,
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
