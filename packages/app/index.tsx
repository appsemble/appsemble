import { setupSentry } from '@appsemble/web-utils';
import { createRoot } from 'react-dom/client';

import { App } from './components/App/index.js';
import './index.css';
import { sentryDsn, sentryEnvironment } from './utils/settings.js';

setupSentry(sentryDsn, sentryEnvironment);

const serviceWorkerRegistrationPromise =
  navigator.serviceWorker?.register('/service-worker.js') ||
  Promise.reject(new Error('Service worker not available'));

createRoot(document.getElementById('app')!).render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
);

window.appsembleHasLoaded = true;
