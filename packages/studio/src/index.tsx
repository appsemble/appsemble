import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import { render } from 'react-dom';

import App from './components/App';
import settings from './utils/settings';

const { sentryDsn } = settings;
init({ dsn: sentryDsn });

render(<App />, document.getElementById('app'));

window.appsembleHasLoaded = true;
