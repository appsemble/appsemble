// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface User {}

declare global {
  interface Window {
    settings: {
      enableRegistration: boolean;
      logins: string[];
      sentryDsn: string;
    };
  }
}
