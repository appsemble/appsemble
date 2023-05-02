import { setupSentry } from '@appsemble/web-utils';
import '@fortawesome/fontawesome-free/css/all.css';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('app')).render(<RouterProvider router={router} />);

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/service-worker.js');
}

window.appsembleHasLoaded = true;
