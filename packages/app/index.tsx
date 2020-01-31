import 'roboto-fontface';
import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import ReactDOM from 'react-dom';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

import App from './components/App';

const { sentryDsn } = document.documentElement.dataset;
init({ dsn: sentryDsn });

let serviceWorkerRegistrationPromise = null;

if ('serviceWorker' in navigator) {
  serviceWorkerRegistrationPromise = runtime.register();
}

ReactDOM.render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
  document.getElementById('app'),
);
