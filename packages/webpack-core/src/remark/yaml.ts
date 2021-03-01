import { safeLoad } from 'js-yaml';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Root } from 'mdast';
import { Attacher } from 'unified';

function transformer(ast: Root): Root {
  ast.children.forEach((node, index) => {
    if (node.type === 'yaml') {
      // eslint-disable-next-line no-param-reassign
      ast.children[index] = {
        type: 'export',
        value: `export const meta = ${JSON.stringify(safeLoad(node.value))};`,
      } as any;
    }
  });
  return ast;
}

/**
 * This remark plugin exposes YAML frontmatter data as a named export called `meta`.
 */
export const remarkYaml: Attacher = () => transformer;
