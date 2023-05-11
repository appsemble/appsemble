import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The Url of the image.
     *
     * Note that this is ignored if the onImage event listener is set.
     */
    url: Remapper;

    /**
     * The alt text of the image.
     *
     */
    alt?: Remapper;

    /**
     * Is image rounded.
     *
     */
    rounded?: boolean;

    /**
     * The alignment of the text content.
     *
     * @default 'left'
     */
    alignment?: 'center' | 'left' | 'right';

    /**
     * The width of the image in pixels.
     */
    width?: number;

    /**
     * The height of the image in pixels.
     */
    height?: number;
  }
}
