import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Route } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider';
import { AppMessagesProvider } from '../AppMessagesProvider';
import { ErrorFallback } from '../ErrorFallback';
import { Main } from '../Main';
import { MenuProvider } from '../MenuProvider';
import { Navigation } from '../Navigation';
import { PermissionRequest } from '../PermissionRequest';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider';
import { UserProvider } from '../UserProvider';

interface AppProps {
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export function App({ serviceWorkerRegistrationPromise }: AppProps): ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <BrowserRouter>
        <Route path="/:lang?">
          <AppDefinitionProvider>
            <MessagesProvider>
              <AppMessagesProvider>
                <ErrorHandler fallback={ErrorFallback}>
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
                </ErrorHandler>
              </AppMessagesProvider>
            </MessagesProvider>
          </AppDefinitionProvider>
        </Route>
      </BrowserRouter>
    </IntlProvider>
  );
}
