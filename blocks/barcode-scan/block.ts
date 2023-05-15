declare module '@appsemble/sdk' {
  interface EventEmitters {
    /**
     * Event that gets emitted once the barcode scanner has identified and resolved a barcode.
     *
     * barcode event only holds the barocde number.
     */
    foundBarcode: never;
  }

  interface Messages {
    /**
     * This message is displayed if the data is empty.
     */
    empty: never;

    /**
     * This message is displayed if there was a problem loading the data.
     */
    error: never;

    /**
     * This message is displayed if no data has been loaded yet.
     */
    loading: never;
  }

  interface Parameters {
    /**
     * Type is either camera or file
     */
    type?: 'camera';
  }
}
