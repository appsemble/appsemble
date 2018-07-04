import 'roboto-fontface';
// It is important to load react-hot-loader before react.
import { hot } from 'react-hot-loader';
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
import './utils/mock-axios';
import App from './components/App';
import * as reducers from './actions';


const AppContainer = process.env.NODE_ENV === 'production' ? App : hot(module)(App);


// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(combineReducers(reducers), composeEnhancers(applyMiddleware(thunk)));


function render() {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer />
    </Provider>,
    document.getElementById('app'),
  );
}


render();


if (process.env.NODE_ENV === 'development') {
  module.hot.accept('./components/App', () => {
    render();
  });

  module.hot.accept('./actions', () => {
    store.replaceReducer(combineReducers(reducers));
  });
}
