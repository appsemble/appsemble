import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider/index.js';
import { AppMemberProvider } from '../AppMemberProvider/index.js';
import { AppMessagesProvider } from '../AppMessagesProvider/index.js';
import { AppRoutes } from '../AppRoutes/index.js';
import { AppVariablesProvider } from '../AppVariablesProvider/index.js';
import { DemoAppMembersProvider } from '../DemoAppMembersProvider/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { InstallationTracker } from '../InstallationTracker/index.js';
import { LanguageUnsupportedBanner } from '../LanguageUnsupportedBanner/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { PageTracker } from '../PageTracker/index.js';
import { PermissionRequest } from '../PermissionRequest/index.js';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider/index.js';

interface AppProps {
  readonly serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null>;
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
                <AppMemberProvider>
                  <DemoAppMembersProvider>
                    <MenuProvider>
                      <LanguageUnsupportedBanner />
                      <InstallationTracker />
                      <PermissionRequest />
                      <AppRoutes />
                    </MenuProvider>
                  </DemoAppMembersProvider>
                </AppMemberProvider>
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
