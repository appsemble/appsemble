import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import App from './components/App';
import getDb from '../app/utils/getDB';
import * as reducers from '../app/actions';

async function getStore() {
  const db = await getDb({ id: 'appsemble-editor' });

  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;
  return createStore(
    combineReducers(reducers),
    {
      app: {
        app: {
          authentication: {
            url: `${window.location.origin}/oauth/token`,
            refreshURL: `${window.location.origin}/oauth/token`,
            clientId: 'appsemble-editor',
            scope: 'apps:read apps:write',
          },
        },
      },
      db,
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
