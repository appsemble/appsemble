import { App } from '@appsemble/types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface User {}

declare global {
  interface Window {
    settings: {
      app: App;
      enableRegistration: boolean;
      loginMethods: Set<string>;
      sentryDsn: string;
    };
  }
}
