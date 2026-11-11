import { setupSentry } from '@appsemble/web-utils';
import axios from 'axios';
import { createRoot } from 'react-dom/client';

import { App } from './components/App/index.js';
import './index.css';
import { polyfillStorage } from './utils/polyfillStorage.js';
import { apiUrl, passwordToken, sentryDsn, sentryEnvironment } from './utils/settings.js';

polyfillStorage();
setupSentry(sentryDsn, sentryEnvironment);

if (passwordToken) {
  // The browser sends the app password to the app host only, so the API gets this token instead.
  axios.interceptors.request.use((config) => {
    if (axios.getUri(config).startsWith(`${apiUrl}/`)) {
      config.headers.set('X-Appsemble-Password-Token', passwordToken);
    }
    return config;
  });
}

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
