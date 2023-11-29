import '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    onClick: never;
  }

  interface EventListeners {
    test: never;
  }

  interface Parameters {
    type: object;
  }
}
