import { paths as action } from './action.js';
import { paths as appCollections } from './appCollections.js';
import { paths as translations } from './appMessages.js';
import { paths as appOAuth2Secrets } from './appOAuth2Secrets.js';
import { paths as appQuotas } from './appQuotas.js';
import { paths as apps } from './apps.js';
import { paths as appSamlSecrets } from './appSamlSecrets.js';
import { paths as scimEndpoints } from './appScimEndpoints.js';
import { paths as appScimSecrets } from './appScimSecrets.js';
import { paths as appsembleMessages } from './appsembleMessages.js';
import { paths as appServiceSecrets } from './appServiceSecrets.js';
import { paths as appSSLSecrets } from './appSSLSecrets.js';
import { paths as appVariables } from './appVariables.js';
import { paths as assets } from './assets.js';
import { paths as blocks } from './blocks.js';
import { paths as containerLogs } from './containerLogs.js';
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
import { paths as trainings } from './trainings.js';
import { paths as user } from './user.js';

export const paths = {
  ...appOAuth2Secrets,
  ...apps,
  ...appSamlSecrets,
  ...appScimSecrets,
  ...scimEndpoints,
  ...appsembleMessages,
  ...appSSLSecrets,
  ...appVariables,
  ...appCollections,
  ...appQuotas,
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
  ...trainings,
  ...containerLogs,
};
