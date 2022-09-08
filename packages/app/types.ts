import { EventEmitter } from 'events';

import { ShowMessage } from '@appsemble/react-components';
import {
  ActionDefinition,
  AppDefinition,
  BlockDefinition,
  BlockManifest,
  Remapper,
  TeamMember,
  UserInfo,
} from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import { Dispatch } from 'react';
import { NavigateFunction, PathMatch } from 'react-router-dom';
import { JsonValue } from 'type-fest';

import { ActionCreators } from './utils/actions/index.js';

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
      blockManifests: BlockManifest[];
      vapidPublicKey: string;
      id: number;
      definition: AppDefinition;
      languages: string[];
      logins: {
        icon: IconName;
        id: number;
        name: string;
        type: 'oauth2' | 'saml';
      }[];
      sentryDsn: string;
      sentryEnvironment: string;
      showAppsembleLogin: boolean;
      showAppsembleOAuth2Login: boolean;
      appUpdated: string;
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

export type UpdateTeam = (team: TeamMember) => void;

export interface MakeActionParameters<D extends ActionDefinition> {
  app: AppDefinition;
  definition: D;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  navigate: NavigateFunction;
  pageReady: Promise<void>;
  route: PathMatch<'lang' | 'pageId'> | PathMatch<'lang'>;
  showShareDialog: ShowShareDialog;
  showDialog: ShowDialogAction;
  prefix: string;
  prefixIndex: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  ee: EventEmitter;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  showMessage: ShowMessage;
  getUserInfo: () => UserInfo;
  passwordLogin: (params: { username: string; password: string }) => Promise<void>;
  setUserInfo: Dispatch<UserInfo>;
  updateTeam: UpdateTeam;
  teams: TeamMember[];
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe: () => Promise<PushSubscription>;
  unsubscribe: () => Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission: () => Promise<NotificationPermission>;
}
