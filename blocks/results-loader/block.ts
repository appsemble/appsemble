declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that is dispatched during the initial load.
     */
    onLoad: never;
  }

  interface Messages {
    /**
     * The error message that should be shown when data failed to load.
     */
    loadErrorMessage: never;
  }

  interface EventListeners {
    /**
     * Event that listens to incoming data
     */
    data: never;
  }

  interface EventEmitters {
    /**
     * Event that gets emitted once the `onLoad` action has finished.
     */
    data: never;
  }
}

export {};
