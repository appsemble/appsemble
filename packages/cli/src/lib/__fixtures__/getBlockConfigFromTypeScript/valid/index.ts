import '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    testAction: {};
  }

  interface EventEmitters {
    testEmit: {};
  }

  interface EventListeners {
    testListener: {};
  }

  interface Parameters {
    param1: string;
    param2: number;
    param3: boolean;
    param4?: string;
    param5: {
      nested1: string;
      nested2: number;
      nested3: boolean;
    };
    param6: string[];
  }
}
