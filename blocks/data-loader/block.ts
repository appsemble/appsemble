export {};

declare module '@appsemble/sdk' {
  interface Actions {
    onLoad: {};
  }

  interface Parameters {
    skipInitialLoad: boolean;
  }

  interface EventEmitters {
    data: {};
  }

  interface EventListeners {
    refresh: {};
  }
}
