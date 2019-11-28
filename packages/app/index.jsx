import 'roboto-fontface';
import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

import reducers from './actions';
import { registerServiceWorker, registerServiceWorkerError } from './actions/serviceWorker';
import App from './components/App';
import resolveJsonPointers from './utils/resolveJsonPointers';

const { sentryDsn } = document.documentElement.dataset;
init({ dsn: sentryDsn });

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk)));

if ('serviceWorker' in navigator) {
  runtime
    .register()
    .then(async registration => {
      await registerServiceWorker(registration)(store.dispatch, store.getState);
    })
    .catch(store.dispatch(registerServiceWorkerError));
}

// Used by the live editor to communicate new app recipes
window.addEventListener('message', event => {
  if (event.data.type === 'editor/EDIT_SUCCESS') {
    const app = resolveJsonPointers(event.data.app);
    store.dispatch({ type: event.data.type, definition: app.definition });

    const replaceStyle = (id, style) => {
      const oldNode = document.getElementById(id);
      const newNode = document.createElement('style');
      newNode.appendChild(document.createTextNode(style));
      newNode.id = id;

      if (oldNode) {
        document.head.replaceChild(newNode, oldNode);
      } else {
        document.head.appendChild(newNode);
      }
    };

    replaceStyle('appsemble-style-core', event.data.style);
    replaceStyle('appsemble-style-shared', event.data.sharedStyle);
  }
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app'),
);
