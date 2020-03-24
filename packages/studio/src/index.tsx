import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import settings from './utils/settings';

const { sentryDsn } = settings;
init({ dsn: sentryDsn });

ReactDOM.render(<App />, document.getElementById('app'));
