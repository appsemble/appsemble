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

  interface Parameters {
    /**
     * The alt text of the image.
     *
     */
    alt?: Remapper;

    /**
     * This image will be shown in fullscreened if image is clicked.
     *
     * @default false
     */
    fullscreen?: boolean;

    /**
     * The height of the image in pixels.
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
     * The Url or src of the image.
     *
     * Note that remappers must be used if the image is received through the data event listener.
     */
    url: Remapper;

    /**
     * The width of the image in pixels.
     *
     * @default 250
     */
    width?: number;
  }
}
