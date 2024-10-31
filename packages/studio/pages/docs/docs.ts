import { applyPackages } from './packages/index.js';

const context = require.context('.', true, /\.mdx?$/);
const order = [
  'studio',
  'app',
  'guides',
  'development',
  'deployment',
  'actions',
  'remappers',
  'reference',
  'packages',
];

export const docs = context
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
        .replace(/(^|\/)index$/, '/')
        .toLowerCase(),
      searchIndex,
      title,
      ...frontmatter,
    };
  })
  .sort((a, b) => order.indexOf(a.path.split('/')[0]) - order.indexOf(b.path.split('/')[0]));

applyPackages(docs);
