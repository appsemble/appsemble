import { combineReducers } from 'redux';

import apps from './apps';

const actions = combineReducers({ apps });

export default actions;
export type State = ReturnType<typeof actions>;
