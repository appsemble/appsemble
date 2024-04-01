import { ActionRoutes } from './actions/index.js';
import { applyPackages } from './packages/index.js';
import { ReferenceRoutes } from './reference/index.js';
import { RemapperRoutes } from './remapper/index.js';

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
    const result = {
      Component,
      path: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      searchIndex,
      title,
      ...frontmatter,
    };
    switch (title) {
      case 'Actions':
        return { ...result, Component: ActionRoutes };
      case 'Remapper':
        return { ...result, Component: RemapperRoutes };
      case 'Reference':
        return { ...result, Component: ReferenceRoutes };
      case 'Action Reference':
        return { ...result, title: 'Actions' };
      case 'App Reference':
        return { ...result, title: 'App' };
      default:
        return result;
    }
  })
  .sort((a, b) => a.path.localeCompare(b.path));

applyPackages(documents);

export const docs = documents;
