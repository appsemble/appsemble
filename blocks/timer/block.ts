declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The time between the emitted events in seconds.
     */
    interval: number;
  }

  interface EventEmitters {
    /**
     * The event to emit on an interval
     */
    interval: never;
  }
}
