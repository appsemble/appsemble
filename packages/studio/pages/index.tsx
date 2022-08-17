import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { AnonymousRoute } from '../components/AnonymousRoute/index.js';
import { ProtectedRoute } from '../components/ProtectedRoute/index.js';
import { enableRegistration } from '../utils/settings.js';
import { AppsRoutes } from './apps/index.js';
import { BlockRoutes } from './blocks/index.js';
import { CallbackPage } from './callback/index.js';
import { ConnectRoutes } from './connect/index.js';
import { DocsRoutes } from './docs/index.js';
import { EditPasswordPage } from './edit-password/index.js';
import { FeedbackPage } from './feedback/index.js';
import { LoginPage } from './login/index.js';
import { OrganizationInvitePage } from './organization-invite/index.js';
import { OrganizationsRoutes } from './organizations/index.js';
import { PrivacyPolicyPage } from './privacy/index.js';
import { RegisterPage } from './register/index.js';
import { ResetPasswordPage } from './reset-password/index.js';
import { SAMLResponsePage } from './saml/index.js';
import { SettingsRoutes } from './settings/index.js';
import { VerifyPage } from './verify/index.js';

/**
 * Render all top level routes.
 */
export function Routes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/apps`}>
        <AppsRoutes />
      </Route>
      <Route path={`${path}/blocks`}>
        <BlockRoutes />
      </Route>
      <Route path={`${path}/organizations`}>
        <OrganizationsRoutes />
      </Route>
      <ProtectedRoute path={`${path}/settings`}>
        <SettingsRoutes />
      </ProtectedRoute>
      <ProtectedRoute path={`${path}/feedback`}>
        <FeedbackPage />
      </ProtectedRoute>
      <Route path={`${path}/connect/authorize`}>
        <ConnectRoutes />
      </Route>
      <AnonymousRoute exact path={`${path}/edit-password`}>
        <EditPasswordPage />
      </AnonymousRoute>
      <Route exact path={`${path}/organization-invite`}>
        <OrganizationInvitePage />
      </Route>
      <Route exact path={`${path}/verify`}>
        <VerifyPage />
      </Route>
      <Route exact path={`${path}/callback`}>
        <CallbackPage />
      </Route>
      <AnonymousRoute exact path={`${path}/login`}>
        <LoginPage />
      </AnonymousRoute>
      {enableRegistration ? (
        <AnonymousRoute exact path={`${path}/register`}>
          <RegisterPage />
        </AnonymousRoute>
      ) : null}
      <Route exact path={`${path}/reset-password`}>
        <ResetPasswordPage />
      </Route>
      <Route exact path={`${path}/saml/response/:code?`}>
        <SAMLResponsePage />
      </Route>
      <Route path={`${path}/docs`}>
        <DocsRoutes />
      </Route>
      <Route exact path={`${path}/privacy`}>
        <PrivacyPolicyPage />
      </Route>
      <Redirect to={`${path}/apps`} />
    </Switch>
  );
}
