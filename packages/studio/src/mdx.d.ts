/**
 * A post-processed MDX markdown document.
 */
declare module '*.md' {
  import { IconName } from '@fortawesome/fontawesome-common-types';
  import { FC, ReactChild } from 'react';

  export interface MDXWrapperProps {
    /**
     * The content to render.
     */
    children?: ReactChild;

    /**
     * By default markdown pages are considered to fill an entire main page. Set this to `false` to
     * render the arkdown content only.
     */
    main?: boolean;
  }

  /**
   * The MDX document as a React component.
   */
  const mdxComponent: FC<MDXWrapperProps>;
  export default mdxComponent;

  /**
   * An icon for the document.
   */
  export const icon: IconName | undefined;

  /**
   * The level page header of the document as a string.
   */
  export const title: string;
}

/**
 * A post-processed MDX document.
 */
declare module '*.mdx' {
  // eslint-disable-next-line import/no-unresolved
  export * from '*.md';
}
