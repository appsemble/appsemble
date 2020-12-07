import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import { render } from 'react-dom';

import { App } from './components/App';
import { sentryDsn, sentryEnvironment } from './utils/settings';

init({ dsn: sentryDsn, environment: sentryEnvironment, release: process.env.APPSEMBLE_VERSION });

render(<App />, document.getElementById('app'));

window.appsembleHasLoaded = true;
