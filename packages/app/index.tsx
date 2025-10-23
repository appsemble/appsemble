import { setupSentry } from '@appsemble/web-utils';
import { createRoot } from 'react-dom/client';

import { App } from './components/App/index.js';
import './index.css';
import { sentryDsn, sentryEnvironment } from './utils/settings.js';

setupSentry(sentryDsn, sentryEnvironment);

// WebPack does not allow it
// eslint-disable-next-line unicorn/prefer-top-level-await
const serviceWorkerRegistrationPromise = (async () => {
  if (!('serviceWorker' in navigator)) {
    // eslint-disable-next-line no-console
    console.warn('Service workers not supported in this environment.');
    return null;
  }

  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Service worker registration failed:', err);
    return null;
  }
})();

createRoot(document.getElementById('app')!).render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
);

window.appsembleHasLoaded = true;
