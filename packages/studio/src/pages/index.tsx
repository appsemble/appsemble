import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { AnonymousRoute } from '../components/AnonymousRoute';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { enableRegistration } from '../utils/settings';
import { AppsRoutes } from './apps';
import { BlockRoutes } from './blocks';
import { CallbackPage } from './callback';
import { ConnectRoutes } from './connect';
import { DocsRoutes } from './docs';
import { EditPasswordPage } from './edit-password';
import { FeedbackPage } from './feedback';
import { LoginPage } from './login';
import { OrganizationInvitePage } from './organization-invite';
import { OrganizationsRoutes } from './organizations';
import { PrivacyPolicyPage } from './privacy';
import { RegisterPage } from './register';
import { ResetPasswordPage } from './reset-password';
import { SAMLResponsePage } from './saml';
import { SettingsRoutes } from './settings';
import { VerifyPage } from './verify';

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
