import type { OpenAPIV3 } from 'openapi-types';

import apps from './apps';
import assets from './assets';
import blocks from './blocks';
import emails from './emails';
import health from './health';
import invite from './invite';
import oauth from './oauth';
import openid from './openid';
import organizations from './organizations';
import resources from './resources';
import templates from './templates';
import user from './user';

export default {
  ...apps,
  ...assets,
  ...blocks,
  ...emails,
  ...health,
  ...invite,
  ...openid,
  ...oauth,
  ...organizations,
  ...resources,
  ...templates,
  ...user,
} as OpenAPIV3.PathsObject;
