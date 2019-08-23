import { combineReducers } from 'redux';

import app, { AppState } from './app';
import blockDefs, { BlockDefState } from './blockDefs';
import db from './db';
import menu, { MenuState } from './menu';
import message, { MessageState } from './message';
import user, { UserState } from './user';

export interface State {
  app: AppState;
  blockDefs: BlockDefState;
  db: IDBDatabase;
  menu: MenuState;
  message: MessageState;
  user: UserState;
}

export default combineReducers({ app, db, blockDefs, menu, message, user });
