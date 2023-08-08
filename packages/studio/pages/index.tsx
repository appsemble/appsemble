import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppsRoutes } from './apps/index.js';
import { BlockRoutes } from './blocks/index.js';
import { CallbackPage } from './callback/index.js';
import { CollectionsRoutes } from './collections/index.js';
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
import { AnonymousRoute } from '../components/AnonymousRoute/index.js';
import { ProtectedRoute } from '../components/ProtectedRoute/index.js';
import { enableRegistration } from '../utils/settings.js';

/**
 * Render all top level routes.
 */
export function TopLevelRoutes(): ReactElement {
  return (
    <Routes>
      <Route element={<AppsRoutes />} path="/apps/*" />
      <Route element={<BlockRoutes />} path="/blocks/*" />
      <Route element={<OrganizationsRoutes />} path="/organizations/*" />
      <Route element={<ProtectedRoute />}>
        <Route element={<SettingsRoutes />} path="/settings/*" />
        <Route element={<FeedbackPage />} path="/feedback" />
      </Route>
      <Route element={<CollectionsRoutes />} path="/collections/*" />
      <Route element={<ConnectRoutes />} path="/connect/authorize/*" />
      <Route element={<OrganizationInvitePage />} path="/organization-invite" />
      <Route element={<VerifyPage />} path="/verify" />
      <Route element={<CallbackPage />} path="/callback" />
      <Route element={<AnonymousRoute />}>
        {enableRegistration ? <Route element={<RegisterPage />} path="/register" /> : null}
        <Route element={<LoginPage />} path="/login" />
        <Route element={<EditPasswordPage />} path="/edit-password" />
      </Route>
      <Route element={<ResetPasswordPage />} path="/reset-password" />
      <Route element={<SAMLResponsePage />} path="/saml/response/:code" />
      <Route element={<SAMLResponsePage />} path="/saml/response/*" />
      <Route element={<DocsRoutes />} path="/docs/*" />
      <Route element={<PrivacyPolicyPage />} path="/privacy" />
      <Route element={<Navigate to="/apps" />} path="*" />
    </Routes>
  );
}
