export interface User {
  id: number;
  primaryEmail: string;
}

export type Role = 'Owner' | 'Maintainer' | 'AppEditor' | 'Member';

export interface Member {
  id: number;
  name?: string;
  primaryEmail?: string;
  role: Role;
}

export interface Organization {
  id: string;
  name: string;
  role: Role;
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
