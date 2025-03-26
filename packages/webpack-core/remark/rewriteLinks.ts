import { relative, resolve } from 'node:path';

import { type Link, type Root } from 'mdast';
import { type Plugin, type Transformer } from 'unified';
import { visit } from 'unist-util-visit';

const transformer: Transformer<Root> = (ast, vfile) => {
  visit(ast, 'link', (node: Link) => {
    if (/^(https?:\/)?\//.test(node.url)) {
      // External URLs or absolute URLs to Appsemble Studio
      return;
    }
    const chunks = node.url.split('#');
    if (!chunks[0]) {
      // Internal hash URLs
      return;
    }
    // Resolve the link from the directory containing the file.
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const resolved = resolve(vfile.dirname, chunks[0]);
    // Resolve the path relative to the CWD. This works, because the directory
    // containing the docs and the URL prefix are the same. Otherwise, this would
    // need to be replaced as well.
    const rel = relative(vfile.cwd, resolved);
    // Strip the `.md` extension and `index` filename.
    const stripped = rel.replace(/(\/?index)?\.mdx?$/, '');
    // Make the URL absolute, so no weird routing happens at runtime.
    const prefixed = `/${stripped}`;
    chunks[0] = prefixed;
    // Update the node URL, taking the URL hash into account.
    // eslint-disable-next-line no-param-reassign
    node.url = chunks.join('#').toLowerCase();
  });
};

/**
 * This remark plugin rewrites links to they can be resolved at runtime by Appsemble Studio.
 */
export const remarkRewriteLinks: Plugin<[], Root> = () => transformer;
