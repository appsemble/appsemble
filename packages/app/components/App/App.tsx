import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import BottomNavigation from '../BottomNavigation';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import MenuProvider from '../MenuProvider';
import PermissionRequest from '../PermissionRequest';
import ServiceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider';
import SideNavigation from '../SideNavigation';

interface AppProps {
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function App({ serviceWorkerRegistrationPromise }: AppProps): React.ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <ErrorHandler fallback={ErrorFallback}>
        <MessagesProvider>
          <ServiceWorkerRegistrationProvider
            serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
          >
            <MenuProvider>
              <BrowserRouter>
                <PermissionRequest />
                <Main />
                <SideNavigation />
                <BottomNavigation />
              </BrowserRouter>
            </MenuProvider>
          </ServiceWorkerRegistrationProvider>
        </MessagesProvider>
      </ErrorHandler>
    </IntlProvider>
  );
}
