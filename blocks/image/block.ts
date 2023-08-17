import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: never;
  }

  interface Parameters {
    /**
     * The Url of the image.
     *
     * Note that remappers must be used if the image is received through the data event listener.
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
