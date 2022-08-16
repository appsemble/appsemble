/**
 * A post-processed MDX markdown document.
 */
declare module '*.md' {
  import { IconName } from '@fortawesome/fontawesome-common-types';

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
  import { IconName } from '@fortawesome/fontawesome-common-types';

  /**
   * An icon for the document.
   */
  export const icon: IconName | undefined;

  /**
   * The level page header of the document as a string.
   */
  export const title: string;
}
