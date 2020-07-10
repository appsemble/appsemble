import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppDefinitionProvider from '../AppDefinitionProvider';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import MenuProvider from '../MenuProvider';
import Navigation from '../Navigation';
import PermissionRequest from '../PermissionRequest';
import ServiceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider';
import UserProvider from '../UserProvider';

interface AppProps {
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function App({ serviceWorkerRegistrationPromise }: AppProps): ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <ErrorHandler fallback={ErrorFallback}>
        <BrowserRouter>
          <AppDefinitionProvider>
            <MessagesProvider>
              <ServiceWorkerRegistrationProvider
                serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
              >
                <UserProvider>
                  <MenuProvider>
                    <PermissionRequest />
                    <Main />
                    <Navigation />
                  </MenuProvider>
                </UserProvider>
              </ServiceWorkerRegistrationProvider>
            </MessagesProvider>
          </AppDefinitionProvider>
        </BrowserRouter>
      </ErrorHandler>
    </IntlProvider>
  );
}
