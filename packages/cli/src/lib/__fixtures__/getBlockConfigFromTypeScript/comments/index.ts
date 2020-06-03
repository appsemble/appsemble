import '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Valid action comment
     */
    comment: {};

    /**
     * Unexpected comment
     */
    /**
     * Expected comment
     */
    duplicate: {};

    // Ignored line comment
    line: {};
  }

  interface EventEmitters {
    /**
     * Test event emitter.
     */
    testEmit: {};
  }

  interface EventListeners {
    /**
     * Test event listener.
     */
    testListener: {};
  }

  // Comments are extracted by typescript-json-schema
  interface Parameters {
    param: any;
  }
}
