import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppContext from '../AppContext';
import BottomNavigation from '../BottomNavigation';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import PermissionRequest from '../PermissionRequest';
import ServiceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider';
import SideNavigation from '../SideNavigation';

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function App({ serviceWorkerRegistrationPromise }) {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <ErrorHandler fallback={ErrorFallback}>
        <MessagesProvider>
          <ServiceWorkerRegistrationProvider
            serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
          >
            <BrowserRouter>
              <AppContext>
                <PermissionRequest />
                <Main />
                <SideNavigation />
                <BottomNavigation />
              </AppContext>
            </BrowserRouter>
          </ServiceWorkerRegistrationProvider>
        </MessagesProvider>
      </ErrorHandler>
    </IntlProvider>
  );
}

App.propTypes = {
  serviceWorkerRegistrationPromise: PropTypes.shape().isRequired,
};
