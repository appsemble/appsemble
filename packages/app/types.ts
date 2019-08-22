import { Action } from '@appsemble/sdk';
import { App, Block } from '@appsemble/types';
import { History } from 'history';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface User {}

export interface ActionDefinition<T extends Action['type']> {
  type: T;
}

interface ShowDialogParams {
  actionCreators: Record<string, () => Action>;
  blocks: Block[];
  data: any;
  close: () => void;
  fullscreen: boolean;
}

interface FlowActions {
  back: (data: any) => Promise<any>;
  cancel: (data: any) => Promise<any>;
  finish: (data: any) => Promise<any>;
  next: (data: any) => Promise<any>;
}

export interface MakeActionParameters<
  D extends ActionDefinition<T>,
  T extends Action['type'] = any
> {
  app: App;
  definition: D;
  flowActions: FlowActions;
  history: History;
  onSuccess: Action;
  onError: Action;
  showDialog: (params: ShowDialogParams) => () => void;
}
