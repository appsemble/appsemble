import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider/index.js';
import { AppMessagesProvider } from '../AppMessagesProvider/index.js';
import { AppRoutes } from '../AppRoutes/index.js';
import { AppVariablesProvider } from '../AppVariablesProvider/index.js';
import { DemoAppMembersProvider } from '../DemoAppMembersProvider/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { PageTracker } from '../PageTracker/index.js';
import { PermissionRequest } from '../PermissionRequest/index.js';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider/index.js';
import { UserProvider } from '../UserProvider/index.js';

interface AppProps {
  readonly serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export function App({ serviceWorkerRegistrationPromise }: AppProps): ReactNode {
  const appContent = (
    <AppDefinitionProvider>
      <AppVariablesProvider>
        <AppMessagesProvider>
          <MessagesProvider>
            <ErrorHandler fallback={ErrorFallback}>
              <ServiceWorkerRegistrationProvider
                serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
              >
                <UserProvider>
                  <DemoAppMembersProvider>
                    <MenuProvider>
                      <PermissionRequest />
                      <AppRoutes />
                    </MenuProvider>
                  </DemoAppMembersProvider>
                </UserProvider>
              </ServiceWorkerRegistrationProvider>
            </ErrorHandler>
          </MessagesProvider>
        </AppMessagesProvider>
      </AppVariablesProvider>
    </AppDefinitionProvider>
  );

  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        {/* Simple way to get optional parameters back */}
        <Route element={appContent} path="/*" />
        <Route element={appContent} path="/:lang/*" />
      </Routes>
    </BrowserRouter>
  );
}
