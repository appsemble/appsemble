const context = require.context('.', true, /\.mdx?$/);

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
        .replace(/(^|\/)index$/, '/'),
      searchIndex,
      title,
      ...frontmatter,
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));
