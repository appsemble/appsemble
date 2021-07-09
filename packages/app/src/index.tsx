import './index.css';

import { setupSentry } from '@appsemble/web-utils';
import { render } from 'react-dom';

import { App } from './components/App';
import { sentryDsn, sentryEnvironment } from './utils/settings';

setupSentry(sentryDsn, sentryEnvironment);

const serviceWorkerRegistrationPromise =
  navigator.serviceWorker?.register('/service-worker.js') ||
  Promise.reject(new Error('Service worker not available'));

render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
  document.getElementById('app'),
);

window.appsembleHasLoaded = true;
