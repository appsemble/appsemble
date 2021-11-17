import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider';
import { AppMessagesProvider } from '../AppMessagesProvider';
import { AppRoutes } from '../AppRoutes';
import { ErrorFallback } from '../ErrorFallback';
import { MenuProvider } from '../MenuProvider';
import { PageTracker } from '../PageTracker';
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
    <BrowserRouter>
      <PageTracker />
      <Route path="/:lang?">
        <AppDefinitionProvider>
          <AppMessagesProvider>
            <MessagesProvider>
              <ErrorHandler fallback={ErrorFallback}>
                <ServiceWorkerRegistrationProvider
                  serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
                >
                  <UserProvider>
                    <MenuProvider>
                      <PermissionRequest />
                      <AppRoutes />
                    </MenuProvider>
                  </UserProvider>
                </ServiceWorkerRegistrationProvider>
              </ErrorHandler>
            </MessagesProvider>
          </AppMessagesProvider>
        </AppDefinitionProvider>
      </Route>
    </BrowserRouter>
  );
}
