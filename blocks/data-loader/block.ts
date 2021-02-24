declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that gets dispatched when a new filter gets applied.
     *
     * This also gets called during the initial load.
     */
    onLoad: never;
  }

  interface Messages {
    /**
     * The error message that should be shown when data failed to load.
     */
    loadErrorMessage: never;
  }

  interface Parameters {
    /**
     * By default the `onLoad` action is triggered immediately.
     *
     * By setting this to `true`, this won’t happen.
     */
    skipInitialLoad?: boolean;
  }

  interface EventEmitters {
    /**
     * Event that gets emitted once the `onLoad` action has finished.
     *
     * It can be triggered again by sending a `refresh` event.
     */
    data: never;
  }

  interface EventListeners {
    /**
     * When received, the `onLoad` action will be triggered using the parameters passed through this
     * event, which in turn triggers the `data` emit event.
     */
    refresh: never;
  }
}
