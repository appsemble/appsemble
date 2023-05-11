import { paths as action } from './action.js';
import { paths as translations } from './appMessages.js';
import { paths as appOAuth2Secrets } from './appOAuth2Secrets.js';
import { paths as apps } from './apps.js';
import { paths as appSamlSecrets } from './appSamlSecrets.js';
import { paths as appsembleMessages } from './appsembleMessages.js';
import { paths as appServiceSecrets } from './appServiceSecrets.js';
import { paths as appSSLSecrets } from './appSSLSecrets.js';
import { paths as assets } from './assets.js';
import { paths as blocks } from './blocks.js';
import { paths as emails } from './emails.js';
import { paths as health } from './health.js';
import { paths as invite } from './invite.js';
import { paths as oauth2ClientCredentials } from './oauth2ClientCredentials.js';
import { paths as oauth2Login } from './oauth2Login.js';
import { paths as oauth2Provider } from './oauth2Provider.js';
import { paths as organizations } from './organizations.js';
import { paths as resourceHistory } from './resourceHistory.js';
import { paths as resources } from './resources.js';
import { paths as saml } from './saml.js';
import { paths as templates } from './templates.js';
import { paths as user } from './user.js';

export const paths = {
  ...appOAuth2Secrets,
  ...apps,
  ...appSamlSecrets,
  ...appsembleMessages,
  ...appSSLSecrets,
  ...assets,
  ...blocks,
  ...emails,
  ...health,
  ...invite,
  ...oauth2ClientCredentials,
  ...oauth2Login,
  ...oauth2Provider,
  ...organizations,
  ...action,
  ...resourceHistory,
  ...resources,
  ...saml,
  ...templates,
  ...translations,
  ...appServiceSecrets,
  ...user,
};
