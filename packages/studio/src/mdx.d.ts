/**
 * A post-processed MDX markdown document.
 */
declare module '*.md' {
  import { IconName } from '@fortawesome/fontawesome-common-types';
  import { FC } from 'react';

  interface MDXMeta {
    icon?: IconName;
  }

  /**
   * The MDX document as a React component.
   */
  const mdxComponent: FC;
  export default mdxComponent;

  /**
   * Frontmatter YAML metadata available as an object.
   */
  export const meta: MDXMeta | undefined;

  /**
   * The level page header of the document as a string.
   */
  export const title: string;
}

/**
 * A post-processed MDX document.
 */
declare module '*.mdx' {
  export * from '*.md';
}
