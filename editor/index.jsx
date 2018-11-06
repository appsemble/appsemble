import 'bulma/css/bulma.css';
import getDb from '@appsemble/utils/getDB';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import './index.css';
import App from './components/App';
import { user, db } from '../app/actions';

async function getStore() {
  const idb = await getDb({ id: 'appsemble-editor' });

  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;
  return createStore(
    combineReducers({ user, db }),
    {
      db: idb,
    },
    composeEnhancers(applyMiddleware(thunk)),
  );
}

getStore().then(store => {
  ReactDOM.render(
    <Provider store={store}>
      <App
        authentication={{
          url: `${window.location.origin}/oauth/token`,
          refreshURL: `${window.location.origin}/oauth/token`,
          clientId: 'appsemble-editor',
          scope: 'apps:read apps:write',
        }}
      />
    </Provider>,
    document.getElementById('app'),
  );
});
