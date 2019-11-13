import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk from 'redux-thunk';

import * as actions from './actions';
import App from './components/App';
import getDB from './utils/getDB';
import settings from './utils/settings';

const { sentryDsn } = settings;
init({ dsn: sentryDsn });

async function getStore() {
  const idb = await getDB();

  const composeEnhancers =
    (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;
  return createStore(
    combineReducers(actions),
    {
      db: idb,
    },
    composeEnhancers(applyMiddleware(thunk)),
  );
}

getStore().then(store => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app'),
  );
});
