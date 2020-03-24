import './index.css';

import { init } from '@sentry/browser';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './components/App';
import settings from './utils/settings';

const { sentryDsn } = settings;
init({ dsn: sentryDsn });

ReactDOM.render(<App />, document.getElementById('app'));
