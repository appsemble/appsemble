import { setupSentry } from '@appsemble/web-utils';
import '@fortawesome/fontawesome-free/css/all.css';
import { render } from 'react-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './bulma.scss';
import { App } from './components/App/index.js';
import './index.css';
import { sentryDsn, sentryEnvironment } from './utils/settings.js';

setupSentry(sentryDsn, sentryEnvironment);

// See https://github.com/remix-run/react-router/issues/9422#issuecomment-1302564759
const router = createBrowserRouter([
  // Match everything with "*"
  { path: '*', element: <App /> },
]);

render(<RouterProvider router={router} />, document.getElementById('app'));

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/service-worker.js');
}

window.appsembleHasLoaded = true;
