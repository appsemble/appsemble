import type { OpenAPIV3 } from 'openapi-types';

import appOAuth2Secrets from './appOAuth2Secrets';
import apps from './apps';
import assets from './assets';
import blocks from './blocks';
import emails from './emails';
import health from './health';
import invite from './invite';
import oauth2ClientCredentials from './oauth2ClientCredentials';
import oauth2Login from './oauth2Login';
import oauth2Provider from './oauth2Provider';
import organizations from './organizations';
import proxy from './proxy';
import resources from './resources';
import templates from './templates';
import translations from './translations';
import user from './user';

export default {
  ...appOAuth2Secrets,
  ...apps,
  ...assets,
  ...blocks,
  ...emails,
  ...health,
  ...invite,
  ...oauth2ClientCredentials,
  ...oauth2Login,
  ...oauth2Provider,
  ...organizations,
  ...proxy,
  ...resources,
  ...templates,
  ...translations,
  ...user,
} as OpenAPIV3.PathsObject;
