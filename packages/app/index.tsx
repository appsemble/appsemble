import { setupSentry } from '@appsemble/web-utils';
import axios from 'axios';
import { render } from 'preact';

import { App } from './components/App/index.js';
import './index.css';
import { polyfillStorage } from './utils/polyfillStorage.js';
import { apiUrl, passwordToken, sentryDsn, sentryEnvironment } from './utils/settings.js';

polyfillStorage();
setupSentry(sentryDsn, sentryEnvironment);

if (passwordToken) {
  // The password cookie only reaches the app host, so requests to the API carry this token instead.
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

const container = document.getElementById('app')!;
// The container holds the fallback content shown when the app can't run.
container.replaceChildren();
render(<App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />, container);

window.appsembleHasLoaded = true;
