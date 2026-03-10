import { noop } from '@appsemble/utils';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import 'fake-indexeddb/auto';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import jsdom from 'jsdom';

// There is no support for application/xml in happy-dom's DOMParser yet
// https://github.com/capricorn86/happy-dom/issues/282#issuecomment-1169355360
const {
  window: { DOMParser },
} = new jsdom.JSDOM();
window.DOMParser = DOMParser;

URL.createObjectURL = () => '';
URL.revokeObjectURL = noop;

window.settings = {
  apiUrl: 'https://appsemble.app',
  appControllerCode: '',
  appControllerImplementations: {},
  blockManifests: [],
  pageManifests: {},
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  definition: null,
  demoMode: false,
  development: false,
  id: 42,
  languages: ['en', 'nl'],
  logins: [],
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  sentryDsn: null,
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  sentryEnvironment: null,
  showAppsembleLogin: false,
  showAppsembleOAuth2Login: true,
  enableSelfRegistration: true,
  vapidPublicKey: '123',
  appUpdated: '1970-01-01T00:00:00.000Z',
  showDemoLogin: false,
  supportedLanguages: ['en'],
  totp: 'disabled',
};
