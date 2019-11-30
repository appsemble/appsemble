import { combineReducers } from 'redux';

import app from './app';
import blockDefs from './blockDefs';
import db from './db';
import menu from './menu';
import message from './message';
import serviceWorker from './serviceWorker';
import user from './user';

const actions = combineReducers({ app, db, blockDefs, menu, message, user, serviceWorker });

export default actions;

export type State = ReturnType<typeof actions>;
