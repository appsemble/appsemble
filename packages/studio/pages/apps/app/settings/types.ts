import { type AppLock, type AppTotp, type AppVisibility } from '@appsemble/types';

export interface FormValues {
  emailName: string;
  googleAnalyticsID: string;
  metaPixelID: string;
  msClarityID: string;
  sentryDsn: string;
  sentryEnvironment: string;
  icon: File | string;
  maskableIcon?: File;
  iconBackground: string;
  path: string;
  visibility: AppVisibility;
  domain: string;
  locked: AppLock;
  totp: AppTotp;
  showAppDefinition: boolean;
  displayAppMemberName: boolean;
  displayInstallationPrompt: boolean;
  skipGroupInvites: boolean;
  supportedLanguages: string[];
}
