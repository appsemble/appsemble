import { type AppVisibility, type ProjectImplementations } from './index.js';

/**
 * Options for the `createApp` fixture
 */
export interface CreateAppOptions {
  controllerCode?: string;
  controllerImplementations?: ProjectImplementations;
  coreStyle?: string;
  demoMode?: boolean;
  domain?: string;
  googleAnalyticsID?: string;
  icon?: string;
  iconBackground?: string;
  maskableIcon?: string;
  screenshots?: string;
  sentryDsn?: string;
  sentryEnvironment?: string;
  sharedStyle?: string;
  showAppDefinition?: boolean;
  template?: boolean;
  visibility?: AppVisibility;
}

/**
 * Options for the `patchApp` fixture
 */
export interface PatchAppOptions extends CreateAppOptions {
  displayAppMemberName?: boolean;
  displayInstallationPrompt?: boolean;
  emailHost?: string;
  emailName?: string;
  emailPassword?: string;
  emailPort?: number;
  emailSecure?: boolean;
  emailUser?: string;
  enableSelfRegistration?: boolean;
  enableUnsecuredServiceSecrets?: boolean;
  path?: string;
  showAppsembleOAuth2Login?: boolean;
  showAppsembleLogin?: boolean;
  skipGroupInvites?: boolean;
  yaml?: string;
}
