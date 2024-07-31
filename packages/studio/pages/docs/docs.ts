import { applyPackages } from './08-packages/index.js';

const context = require.context('.', true, /\.mdx?$/);

const documents = context
  .keys()
  .map((key) => {
    const {
      default: Component,
      frontmatter,
      searchIndex,
      title,
    } = context(key) as typeof import('*.md');
    return {
      Component,
      path: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      searchIndex,
      title,
      ...frontmatter,
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

applyPackages(documents);

export const docs = documents.map((doc) => ({
  ...doc,
  // Replace ordering prefixes at the start of a path with ''
  // and all the following of format `/number-` with '/'
  path: doc.path
    .replace(/^\d+-/, '')
    .replaceAll(/\/\d+-/g, '/')
    .toLowerCase(),
}));
