import { AppDefinition, AppVisibility } from '@appsemble/types';

import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = '/apps';

export class App {
  id: number;
  longDescription: string;
  path: string;
  visibility: AppVisibility;
  showAppDefinition: boolean;
  locked: boolean;
  showAppsembleLogin: boolean;
  showAppsembleOAuth2Login: boolean;
  sentryDsn: string;
  sentryEnvironment: string;
  definition: AppDefinition;
  yaml: string;
  hasIcon: boolean;
  hasMaskableIcon: boolean;
  iconBackground: string;

  icon?: Buffer;
  domain?: string;

  OrganizationId: string;

  coreStyle = '';
  sharedStyle = '';

  static findOne(query: FindOptions): Promise<App | null> {
    return Methods.findOne(query, dir);
  }
}
