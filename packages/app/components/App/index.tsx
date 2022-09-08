import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider/index.js';
import { AppMessagesProvider } from '../AppMessagesProvider/index.js';
import { AppRoutes } from '../AppRoutes/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { PageTracker } from '../PageTracker/index.js';
import { PermissionRequest } from '../PermissionRequest/index.js';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider/index.js';
import { UserProvider } from '../UserProvider/index.js';

function AppContent(
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>,
): ReactElement {
  return (
    <AppDefinitionProvider>
      <AppMessagesProvider>
        <MessagesProvider>
          <ErrorHandler fallback={ErrorFallback} history={undefined}>
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
  );
}

interface AppProps {
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export function App({ serviceWorkerRegistrationPromise }: AppProps): ReactElement {
  const appContent = AppContent(serviceWorkerRegistrationPromise);
  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        {/* Simple way to get optional paramaters back */}
        <Route element={appContent} path="/*" />
        <Route element={appContent} path="/:lang/*" />
      </Routes>
    </BrowserRouter>
  );
}
