import { type BulmaColor, type IconName, type Remapper } from '@appsemble/sdk';

export interface FooterItem {
  /**
   * Label for the link item.
   */
  label: Remapper;

  /**
   * Icon to be rendered next to the item.
   */
  icon?: IconName;

  /**
   * Action to fire when user clicks on the link.
   *
   * @format action
   */
  onClick?: string;

  /**
   * Whether to hide the link.
   *
   */
  hide?: Remapper;
}

export interface Image {
  /**
   * The alt text of the image.
   *
   */
  alt?: Remapper;

  /**
   * Url or asset name of the image
   *
   * file can either be url or uploaded image
   */
  file: Remapper;

  /**
   * Whether to hide the image.
   *
   */
  hide?: Remapper;
}

export interface FooterColumnWithImage {
  type: 'image';

  /**
   * Image to render in the footer.
   *
   */
  image: Image;
}

export interface FooterColumnWithLinks {
  type: 'links';
  items: FooterItem[];

  /**
   * Title of the column.
   */
  title: Remapper;

  /**
   * Level of the title text.
   *
   * @default 4
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export type FooterColumn = FooterColumnWithImage | FooterColumnWithLinks;

declare module '@appsemble/sdk' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Actions {
    /**
     * Custom action mapping.
     */
    [key: string]: never;
  }

  interface Parameters {
    columns: FooterColumn[];

    /**
     * Alignment of the columns.
     *
     * @default `left`
     */
    alignment?: 'center' | 'left' | 'right';

    /**
     * Background color of the footer
     *
     * @default `light`
     */
    backgroundColor?: BulmaColor;

    /**
     * Color of the links in footer
     *
     * @default `link`
     */
    linkColor?: BulmaColor;

    /**
     * Color of the titles and copyright text.
     *
     * @default `dark`
     */
    textColor?: BulmaColor;

    /**
     * Copyright text to be rendered at the bottom.
     */
    copyright?: Remapper;
  }
}
