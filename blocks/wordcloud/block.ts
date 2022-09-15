declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    data: never;
  }

  interface Parameters {
    /**
     * A list of fields to render out in a table.
     */
    fields: string[];
  }
}

export {};
