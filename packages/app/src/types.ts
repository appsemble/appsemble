import { EventEmitter } from 'events';

import { ShowMessage } from '@appsemble/react-components';
import { Action } from '@appsemble/sdk';
import {
  ActionDefinition,
  AppDefinition,
  BlockDefinition,
  BlockManifest,
  Remapper,
  UserInfo,
} from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import { match as Match, RouteComponentProps } from 'react-router-dom';
import { JsonValue } from 'type-fest';

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
    };
  }
}

export interface ShowDialogParams {
  actionCreators: Record<string, () => Action>;
  blocks: BlockDefinition[];
  closable?: boolean;
  data: any;
  close: () => void;
  fullscreen: boolean;
  prefix: string;
  title?: string;
}

export type ShowDialogAction = (params: ShowDialogParams) => () => void;

export interface FlowActions {
  back: (data: any) => Promise<any>;
  cancel: (data: any) => Promise<any>;
  finish: (data: any) => Promise<any>;
  next: (data: any) => Promise<any>;
}

export interface MakeActionParameters<D extends ActionDefinition> {
  app: AppDefinition;
  definition: D;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  route: Match<{ lang: string }>;
  showDialog: ShowDialogAction;
  prefix: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  ee: EventEmitter;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  showMessage: ShowMessage;
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe: () => Promise<PushSubscription>;
  unsubscribe: () => Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission: () => Promise<NotificationPermission>;
}
