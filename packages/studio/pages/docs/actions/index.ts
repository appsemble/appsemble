import { type MDXContent } from 'mdx/types.js';

interface DocModule {
  default: MDXContent;
  searchIndex: [];
  title: string;
  path: string;
}
export function importDocs(): DocModule[] {
  const mdxFiles = require.context('.', false, /\.mdx$/);
  const keys = mdxFiles.keys();

  return keys.map((key) => ({
    ...mdxFiles(key),
    path: key
      .replace(/^\.\//, '')
      .replace(/\.mdx?$/, '')
      .toLowerCase(),
  }));
}
