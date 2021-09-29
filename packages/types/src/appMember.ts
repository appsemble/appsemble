import { IconName } from '@fortawesome/fontawesome-common-types';

import { App } from '.';

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
  email_verified: boolean;
  picture: string;
  app: App;
  sso: SSOConfiguration[];
}
