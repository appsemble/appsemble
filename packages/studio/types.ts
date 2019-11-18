export interface User {
  id: number;
}

export interface OAuth2ClientCredentials {
  $created?: string;
  id: string;
  secret?: string;
  description: string;
  expires?: string;
  scopes: string[];
}

declare global {
  interface Window {
    settings: {
      enableRegistration: boolean;
      logins: string[];
      sentryDsn: string;
    };
  }
}
