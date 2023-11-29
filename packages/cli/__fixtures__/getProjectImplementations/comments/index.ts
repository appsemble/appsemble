import '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Valid action comment
     */
    comment: never;

    /**
     * Unexpected comment
     */
    /**
     * Expected comment
     */
    duplicate: never;

    // Ignored line comment
    line: never;
  }

  interface EventEmitters {
    /**
     * Test event emitter.
     */
    testEmit: never;
  }

  interface EventListeners {
    /**
     * Test event listener.
     */
    testListener: never;
  }

  // Comments are extracted by typescript-json-schema
  interface Parameters {
    param: any;
  }
}
