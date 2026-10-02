declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * The action that is triggered when changing image.
     */
    onChange: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: never;
  }

  interface Messages {
    /**
     * The accessible name of the control that selects a new image.
     */
    changeImage: never;
  }

  interface Parameters {
    /**
     * The alignment of image.
     *
     * @default 'center'
     */
    alignment?: 'center' | 'left' | 'right';

    /**
     * The alt text of the image.
     *
     */
    alt?: Remapper;

    /**
     * This image will load if url returns invalid or null value.
     *
     */
    defaultImage?: Remapper;

    /**
     * Whether the image fills the full width of the block.
     *
     * The image keeps its natural aspect ratio unless the app theme sets one, for example with
     * `aspect-ratio` on `img`. When true, `width` and `height` are ignored.
     *
     * @default false
     */
    fill?: boolean;

    /**
     * This image will be shown in full screen mode if image is clicked.
     *
     * @default false
     */
    fullscreen?: boolean;

    /**
     * The height of the image in pixels.
     *
     * Ignored when `fill` is true.
     *
     * @default 250
     */
    height?: number;

    /**
     * If true file can be uploaded from device.
     *
     * Actions will work if input is true.
     *
     * @default false
     */
    input?: boolean;

    /**
     * The name used when storing image.
     *
     * Needed when input is true
     *
     * Value should be same as property name in resources where it is going to be stored.
     */
    name?: string;

    /**
     * Is image rounded.
     *
     * With `fill`, the image is forced to a square so it renders as a circle.
     *
     * @default false
     */
    rounded?: boolean;

    /**
     * The Url or src of the image.
     *
     */
    url: Remapper;

    /**
     * The width of the image in pixels.
     *
     * Ignored when `fill` is true.
     *
     * @default 250
     */
    width?: number;
  }
}
