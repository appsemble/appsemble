import { Action } from '@appsemble/sdk';
import { ActionDefinition, AppDefinition, Block, BlockManifest, UserInfo } from '@appsemble/types';
import { RouteComponentProps } from 'react-router-dom';

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
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe(): Promise<PushSubscription>;
  unsubscribe(): Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission(): Promise<NotificationPermission>;
}
