import { FormComponentOptionalLabelContext } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { Route, Router, Switch } from 'wouter-preact';

import { messages } from './messages.js';
import { AppDefinitionProvider } from '../AppDefinitionProvider/index.js';
import { AppIconProvider } from '../AppIconProvider/index.js';
import { AppMemberProvider } from '../AppMemberProvider/index.js';
import { AppMessagesProvider } from '../AppMessagesProvider/index.js';
import { AppRoutes } from '../AppRoutes/index.js';
import { AppVariablesProvider } from '../AppVariablesProvider/index.js';
import { DemoAppMembersProvider } from '../DemoAppMembersProvider/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { ErrorHandler } from '../ErrorHandler/index.js';
import { InstallationTracker } from '../InstallationTracker/index.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { LanguageUnsupportedBanner } from '../LanguageUnsupportedBanner/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { MessagesProvider } from '../MessagesProvider/index.js';
import { PageTracker } from '../PageTracker/index.js';
import { PermissionRequest } from '../PermissionRequest/index.js';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';
import { useRawLocation } from '../../utils/useRawLocation.js';

const optionalLabel = (
  <>
    (<FormattedMessage {...messages.optional} />)
  </>
);

interface AppProps {
  readonly serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null>;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export function App({ serviceWorkerRegistrationPromise }: AppProps): VNode {
  const appContent = (
    <AppDefinitionProvider>
      <AppIconProvider>
        <AppVariablesProvider>
          <AppMessagesProvider>
            <FormComponentOptionalLabelContext.Provider value={optionalLabel}>
              <MessagesProvider>
                <ErrorHandler fallback={ErrorFallback}>
                  <ServiceWorkerRegistrationProvider
                    serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise}
                  >
                    <AppMemberProvider>
                      <DemoAppMembersProvider>
                        <MenuProvider>
                          <LanguageUnsupportedBanner />
                          <VerifyBanner />
                          <InstallationTracker />
                          <PermissionRequest />
                          <AppRoutes />
                        </MenuProvider>
                      </DemoAppMembersProvider>
                    </AppMemberProvider>
                  </ServiceWorkerRegistrationProvider>
                </ErrorHandler>
              </MessagesProvider>
            </FormComponentOptionalLabelContext.Provider>
          </AppMessagesProvider>
        </AppVariablesProvider>
      </AppIconProvider>
    </AppDefinitionProvider>
  );

  return (
    <Router hook={useRawLocation}>
      <PageTracker />
      <Switch>
        <Route path="/:lang/*?">{appContent}</Route>
        <Route>{appContent}</Route>
      </Switch>
    </Router>
  );
}
