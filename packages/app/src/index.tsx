import 'roboto-fontface';
import './index.css';

import { init } from '@sentry/browser';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

import App from './components/App';
import settings from './utils/settings';

init({ dsn: settings.sentryDsn });

const serviceWorkerRegistrationPromise =
  runtime.register() || Promise.reject(new Error('Service worker not available'));

ReactDOM.render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
  document.getElementById('app'),
);
