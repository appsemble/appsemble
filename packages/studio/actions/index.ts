import { combineReducers } from 'redux';

import apps from './apps';
import message from './message';
import openApi from './openApi';

const actions = combineReducers({ apps, message, openApi });

export default actions;
export type State = ReturnType<typeof actions>;
