import { setupSentry } from '@appsemble/web-utils';
import '@fortawesome/fontawesome-free/css/all.css';
import { render } from 'react-dom';

import './bulma.scss';
import { App } from './components/App';
import './index.css';
import { sentryDsn, sentryEnvironment } from './utils/settings';

setupSentry(sentryDsn, sentryEnvironment);

render(<App />, document.getElementById('app'));

if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker?.register('/service-worker.js');
}

window.appsembleHasLoaded = true;
