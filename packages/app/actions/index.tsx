import { combineReducers } from 'redux';

import app from './app';
import blockDefs from './blockDefs';
import user from './user';

const actions = combineReducers({ app, blockDefs, user });

export default actions;

export type State = ReturnType<typeof actions>;
