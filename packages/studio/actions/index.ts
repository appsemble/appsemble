import { combineReducers } from 'redux';

import apps from './apps';
import db from './db';
import message from './message';
import openApi from './openApi';
import user from './user';

const actions = combineReducers({ apps, db, message, openApi, user });

export default actions;
export type State = ReturnType<typeof actions>;
