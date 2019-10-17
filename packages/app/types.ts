import { Action } from '@appsemble/sdk';
import { ActionDefinition, App, Block } from '@appsemble/types';
import { RouteComponentProps } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface User {}

declare global {
  interface Window {
    settings: {
      app: App;
      enableRegistration: boolean;
      loginMethods: Set<string>;
      sentryDsn: string;
    };
  }
}
export interface ActionDefinition<T extends Action['type']> {
  type: T;
}

export interface ShowDialogParams {
  actionCreators: Record<string, () => Action>;
  blocks: Block[];
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
  app: App;
  definition: D;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  onSuccess?: Action;
  onError?: Action;
  showDialog: ShowDialogAction;
}
