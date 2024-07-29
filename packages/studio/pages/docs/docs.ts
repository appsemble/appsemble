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
  path: doc.path.replaceAll(/\d{2}-/g, '').toLocaleLowerCase(),
}));
