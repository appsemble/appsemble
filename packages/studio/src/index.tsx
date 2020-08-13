import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import { render } from 'react-dom';

import { App } from './components/App';
import { sentryDsn } from './utils/settings';

init({ dsn: sentryDsn });

render(<App />, document.getElementById('app'));

window.appsembleHasLoaded = true;
