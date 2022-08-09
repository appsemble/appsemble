import { IconName } from '@fortawesome/fontawesome-common-types';

import { App } from './index.js';

export interface SSOConfiguration {
  type: 'oauth2' | 'saml';
  url: string;
  icon: IconName;
  name: string;
}

export interface AppAccount {
  id: string;
  role: string;
  name: string;
  email: string;
  emailVerified: boolean;
  picture: string;
  app: App;
  sso: SSOConfiguration[];
  properties: Record<string, string>;
}
