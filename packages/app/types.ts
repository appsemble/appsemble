import { type EventEmitter } from 'events';

import { type ShowMessage } from '@appsemble/react-components';
import {
  type ActionDefinition,
  type AppDefinition,
  type AppMemberGroup,
  type AppMemberInfo,
  type BlockDefinition,
  type BlockManifest,
  type Group,
  type ProjectImplementations,
  type Remapper,
  type ResourceSubscribableAction,
  type UserInfo,
} from '@appsemble/types';
import { type AppConfigEntryGetter, type MessageGetter } from '@appsemble/utils';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type Dispatch } from 'react';
import { type NavigateFunction, type Params } from 'react-router-dom';
import { type JsonValue } from 'type-fest';

import { type ActionCreators } from './utils/actions/index.js';
import { type AppStorage } from './utils/storage.js';

declare module '@appsemble/sdk' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Actions {
    [K: string]: ActionDefinition;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface EventEmitters {
    [K: string]: never;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface EventListeners {
    [K: string]: never;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Parameters {
    [K: string]: JsonValue;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Messages {
    [K: string]: Record<string, string>;
  }
}

export interface User extends UserInfo {
  scope: string;
}

export interface Login {
  icon: IconName;
  id: number;
  name: string;
  type: 'oauth2' | 'saml';
}

declare global {
  interface Window {
    /**
     * This boolean indicates if Appsemble has loaded normally.
     *
     * If this is not been set, this means Appsemble didn’t load, probably because it doesn’t
     * recognize newer JavaScript features.
     */
    appsembleHasLoaded: boolean;

    settings: {
      apiUrl: string;
      appControllerCode: string;
      appControllerImplementations: ProjectImplementations;
      blockManifests: BlockManifest[];
      pageManifests: ProjectImplementations;
      vapidPublicKey: string;
      id: number;
      definition: AppDefinition;
      demoMode: boolean;
      languages: string[];
      logins: Login[];
      sentryDsn: string;
      sentryEnvironment: string;
      showAppsembleLogin: boolean;
      showAppsembleOAuth2Login: boolean;
      enableSelfRegistration: boolean;
      showDemoLogin: boolean;
      appUpdated: string;
      development: boolean;
      snapshotId?: number;
      displayAppMemberName?: boolean;
      displayInstallationPrompt?: boolean;
    };
  }
}

export interface ShowDialogParams {
  actionCreators: ActionCreators;
  blocks: BlockDefinition[];
  closable?: boolean;
  data: any;
  close: () => void;
  fullscreen: boolean;
  prefix: string;
  prefixIndex: string;
  title?: Remapper;
}

export type ShowDialogAction = (params: ShowDialogParams) => () => void;
export interface ShowShareDialogParams {
  url?: string;
  text?: string;
  title?: string;
}
export type ShowShareDialog = (params: ShowShareDialogParams) => Promise<void>;

export interface FlowActions {
  back: (data: any) => Promise<any>;
  cancel: (data: any) => Promise<any>;
  finish: (data: any) => Promise<any>;
  next: (data: any) => Promise<any>;
  to: (data: any, step: string) => Promise<any>;
}

export interface MakeActionParameters<D extends ActionDefinition> {
  appDefinition: AppDefinition;
  getAppMessage?: MessageGetter;
  getAppVariable?: AppConfigEntryGetter;
  appStorage: AppStorage;
  definition: D;
  extraCreators?: ActionCreators;
  flowActions?: FlowActions;
  navigate?: NavigateFunction;
  pageReady: Promise<void>;
  params: Readonly<Params<string>>;
  showShareDialog?: ShowShareDialog;
  showDialog?: ShowDialogAction;
  prefix: string;
  prefixIndex: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  ee: EventEmitter;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  showMessage?: ShowMessage;
  getAppMemberInfo: () => AppMemberInfo;
  passwordLogin: (params: { username: string; password: string }) => Promise<void>;
  passwordLogout: () => Promise<void>;
  setAppMemberInfo: Dispatch<AppMemberInfo>;
  appMemberGroups: AppMemberGroup[];
  addAppMemberGroup: (group: Group) => void;
  getAppMemberSelectedGroup: () => AppMemberGroup;
  refetchDemoAppMembers: () => Promise<void>;
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe: (
    resourceActionsToSubscribeTo?: {
      resourceType: string;
      action: ResourceSubscribableAction;
    }[],
  ) => Promise<PushSubscription>;
  unsubscribe: () => Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission: () => Promise<NotificationPermission>;
}
