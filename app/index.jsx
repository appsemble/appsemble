import 'bulma/css/bulma.css';
import 'roboto-fontface';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Provider,
} from 'react-redux';
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore,
} from 'redux';
import thunk from 'redux-thunk';

import './index.css';
import App from './components/App';
import * as reducers from './actions';

import resolveJsonPointers from './utils/resolveJsonPointers';

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(combineReducers(reducers), composeEnhancers(applyMiddleware(thunk)));

// Used by the live editor to communicate new app recipes
window.addEventListener('message', (event) => {
  if (event.data.type === 'editor/EDIT_SUCCESS') {
    const app = resolveJsonPointers(event.data.app);
    store.dispatch({ type: event.data.type, app });
  }
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app'),
);
