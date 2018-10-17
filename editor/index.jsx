import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';

import App from './components/App';
import getDb from '../app/utils/getDB';
import user from '../app/actions/user';

async function getStore() {
  const db = await getDb({ id: 'appsemble-editor' });

  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;
  return createStore(user, { db }, composeEnhancers(applyMiddleware(thunk)));
}

getStore().then(store => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app'),
  );
});
