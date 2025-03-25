declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * The action to dispatch with the pagination parameters
     */
    onLoad: never;
  }

  interface EventEmitters {
    /**
     * This event is emitted when new data is available because of a user interaction with
     * pagination.
     */
    paginated: never;
  }

  interface EventListeners {
    /**
     * This event resets the pagination, goes to the first page and re-enables tracking
     */
    reset: never;

    /**
     * This event sets the total number of items, based on which the number of pages
     * will be calculated
     */
    itemsCountChange: never;

    /**
     * This event tells the paginator to start tracking for scrolling.
     *
     * Only used when `paginatorType` is `scroll`.
     */
    toggleTracking: never;
  }

  interface Parameters {
    /**
     * The number of items per page
     */
    itemsPerPage: number;

    /**
     * @default limit-offset
     */
    paginationType: 'limit-offset';

    /**
     * The type of the pagination
     *
     * `buttons` displays clickable pagination buttons
     *
     * `scroll` displays a hidden element, which when scrolled to, increments the current page
     *
     * @default buttons
     */
    paginatorType: 'buttons' | 'scroll';
  }

  interface Messages {
    /**
     * The label of the previous button
     */
    prevLabel: never;

    /**
     * The label of the next button
     */
    nextLabel: never;
  }
}
