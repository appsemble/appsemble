export interface Field {
  name: string;
  label?: string;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    fields: Field[];
  }

  interface Actions {
    onClick: {};
  }

  interface EventListeners {
    data: {};
  }
}
