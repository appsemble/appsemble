import '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    onClick: never;
  }

  interface EventListeners {
    test: never;
  }

  interface Messages {
    empty: never;
  }

  interface Parameters {
    type: object;
  }
}
