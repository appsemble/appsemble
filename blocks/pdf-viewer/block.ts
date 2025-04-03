declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that gets dispatched during the initial load.
     */
    onLoad: never;
  }

  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    data: never;
  }

  interface Messages {
    /**
     * This message is displayed if there was a problem loading the data.
     */
    error: never;
  }

  interface Parameters {
    /**
     * Height of the container in which PDF is displayed
     */
    height?: number | string;

    /**
     * Width of the container in which PDF is displayed
     */
    width?: number | string;
  }
}
