import { Action } from '@appsemble/sdk';

export interface Actions {
  onLoad: Action;
}

export interface Events {
  emit: 'data';
  listen: 'refresh';
}
