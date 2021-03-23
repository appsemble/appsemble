import './index.css';

import { setupSentry } from '@appsemble/web-utils';
import { render } from 'react-dom';

import { App } from './components/App';
import { sentryDsn, sentryEnvironment } from './utils/settings';

setupSentry(sentryDsn, sentryEnvironment);

render(<App />, document.getElementById('app'));

navigator.serviceWorker?.register('/service-worker.js');

window.appsembleHasLoaded = true;
