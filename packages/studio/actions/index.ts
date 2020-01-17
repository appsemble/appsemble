import { combineReducers } from 'redux';

import apps from './apps';
import openApi from './openApi';

const actions = combineReducers({ apps, openApi });

export default actions;
export type State = ReturnType<typeof actions>;
