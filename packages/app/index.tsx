import { setupSentry } from '@appsemble/web-utils';
import { createRoot } from 'react-dom/client';

import { App } from './components/App/index.js';
import './index.css';
import { sentryDsn, sentryEnvironment } from './utils/settings.js';

setupSentry(sentryDsn, sentryEnvironment);

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

if ('serviceWorker' in navigator) {
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Service worker registration failed:', err);
  }
} else {
  // eslint-disable-next-line no-console
  console.warn('Service workers not supported in this environment.');
}

const serviceWorkerRegistrationPromise = Promise.resolve(serviceWorkerRegistration);

createRoot(document.getElementById('app')!).render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
);

window.appsembleHasLoaded = true;
