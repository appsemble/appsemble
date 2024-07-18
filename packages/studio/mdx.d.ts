/**
 * A post-processed MDX markdown document.
 */
declare module '*.md' {
  import { IconName } from '@fortawesome/fontawesome-common-types';

  export const frontmatter:
    | undefined
    | {
        /**
         * An icon for the document.
         */
        icon?: IconName | undefined;

        /**
         * A replacement name for the menu item.
         */
        menu?: string | undefined;
      };

  export const searchIndex: [string, { title: string; haystack: string }][];

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

  export const frontmatter:
    | undefined
    | {
        /**
         * An icon for the document.
         */
        icon?: IconName | undefined;
      };

  export const searchIndex: [string, { title: string; haystack: string }][];

  /**
   * The level page header of the document as a string.
   */
  export const title: string;
}
