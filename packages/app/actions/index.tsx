import { combineReducers } from 'redux';

import app from './app';
import blockDefs from './blockDefs';
import db from './db';
import menu from './menu';
import serviceWorker from './serviceWorker';
import user from './user';

const actions = combineReducers({ app, db, blockDefs, menu, user, serviceWorker });

export default actions;

export type State = ReturnType<typeof actions>;
