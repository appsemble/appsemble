import { Action, Block } from '@appsemble/sdk';
import { ActionDefinition, AppDefinition, BlockManifest, UserInfo } from '@appsemble/types';
import { EventEmitter } from 'events';
import { RouteComponentProps } from 'react-router-dom';
import { JsonValue } from 'type-fest';

declare module '@appsemble/sdk' {
  interface Actions {
    [K: string]: ActionDefinition;
  }

  interface EventEmitters {
    [K: string]: {};
  }

  interface EventListeners {
    [K: string]: {};
  }

  interface Parameters {
    [K: string]: JsonValue;
  }
}

export interface User extends UserInfo {
  scope: string;
}

declare global {
  interface Window {
    settings: {
      apiUrl: string;
      blockManifests: BlockManifest[];
      vapidPublicKey: string;
      id: number;
      organizationId: string;
      definition: AppDefinition;
      sentryDsn: string;
    };
  }
}

export interface ShowDialogParams {
  actionCreators: Record<string, () => Action>;
  blocks: Block[];
  closable?: boolean;
  data: any;
  close: () => void;
  fullscreen: boolean;
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
  onSuccess?: Action;
  onError?: Action;
  showDialog: ShowDialogAction;
  pushNotifications: ServiceWorkerRegistrationContextType;
  ee: EventEmitter;
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe(): Promise<PushSubscription>;
  unsubscribe(): Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission(): Promise<NotificationPermission>;
}
