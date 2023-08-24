// Blocks can actions, parameters, messages, and event listeners and emitters. These can be defined
// by augmenting the @appsemble/sdk module. Typically this happens in a file named block.ts. When a
// block is published, the CLI will process the augmented interfaces and validate the app definition
// complies with them. The JSDoc will be used to render documentation.

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    data: never;
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
     * A list of fields to render out in a table.
     */
    fields: string[];
  }
}
