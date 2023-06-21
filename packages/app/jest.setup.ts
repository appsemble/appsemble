import { noop } from '@appsemble/utils';
import 'fake-indexeddb/auto';

URL.createObjectURL = () => '';
URL.revokeObjectURL = noop;

window.settings = {
  apiUrl: 'https://appsemble.dev',
  blockManifests: [],
  definition: null,
  development: false,
  id: 42,
  languages: ['en', 'nl'],
  logins: [],
  sentryDsn: null,
  sentryEnvironment: null,
  showAppsembleLogin: false,
  showAppsembleOAuth2Login: true,
  vapidPublicKey: '123',
  appUpdated: '1970-01-01T00:00:00.000Z',
};
