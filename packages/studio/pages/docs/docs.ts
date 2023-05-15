const context = require.context('../../../../docs', true, /\.mdx?$/);

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
      p: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      searchIndex,
      title,
      ...frontmatter,
    };
  })
  .sort((a, b) => a.p.localeCompare(b.p));
