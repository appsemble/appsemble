import { paths as action } from './action';
import { paths as translations } from './appMessages';
import { paths as appOAuth2Secrets } from './appOAuth2Secrets';
import { paths as apps } from './apps';
import { paths as appSamlSecrets } from './appSamlSecrets';
import { paths as appsembleMessages } from './appsembleMessages';
import { paths as assets } from './assets';
import { paths as blocks } from './blocks';
import { paths as emails } from './emails';
import { paths as health } from './health';
import { paths as invite } from './invite';
import { paths as oauth2ClientCredentials } from './oauth2ClientCredentials';
import { paths as oauth2Login } from './oauth2Login';
import { paths as oauth2Provider } from './oauth2Provider';
import { paths as organizations } from './organizations';
import { paths as resourceHistory } from './resourceHistory';
import { paths as resources } from './resources';
import { paths as saml } from './saml';
import { paths as templates } from './templates';
import { paths as user } from './user';

export const paths = {
  ...appOAuth2Secrets,
  ...apps,
  ...appSamlSecrets,
  ...appsembleMessages,
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
  ...user,
};
