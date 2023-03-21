const context = require.context('../../../../docs', true, /\.mdx?$/);

export const docs = context
  .keys()
  .map((key) => {
    const { default: Component, icon, searchIndex, title } = context(key) as typeof import('*.md');
    return {
      Component,
      icon,
      p: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      searchIndex,
      title,
    };
  })
  .sort((a, b) => a.p.localeCompare(b.p));
