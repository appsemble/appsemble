import { MetaProvider } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { AppSettings } from '../AppSettings/index.js';
import { EditPassword } from '../EditPassword/index.js';
import { Login } from '../Login/index.js';
import { OpenIDCallback } from '../OpenIDCallback/index.js';
import { Page } from '../Page/index.js';
import { Register } from '../Register/index.js';
import { ResetPassword } from '../ResetPassword/index.js';
import { SentryFeedback } from '../SentryFeedback/index.js';
import { TeamInvite } from '../TeamInvite/index.js';
import { useUser } from '../UserProvider/index.js';
import { Verify } from '../Verify/index.js';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export function AppRoutes(): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const { getAppMessage } = useAppMessages();
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();

  if (definition == null) {
    return null;
  }

  const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
  const hasCustomLogin = definition.pages.some((page) => page.name === 'Login');
  const hasCustomRegister = definition.pages.some((page) => page.name === 'Register');

  return (
    <MetaProvider
      description={getAppMessage({ id: 'description' }).format() as string}
      title={getAppMessage({ id: 'name' }).format() as string}
    >
      <Routes>
        <Route caseSensitive element={<AppSettings />} path="/Settings" />

        {!isLoggedIn && !hasCustomLogin ? (
          <Route caseSensitive element={<Login />} path="/Login" />
        ) : null}
        {!isLoggedIn && !hasCustomRegister ? (
          <Route
            caseSensitive
            element={hasCustomRegister ? <Page /> : <Register />}
            path="/Register"
          />
        ) : null}

        <Route caseSensitive element={<TeamInvite />} path="/Team-Invite" />
        <Route caseSensitive element={<ResetPassword />} path="/Reset-Password" />
        <Route caseSensitive element={<EditPassword />} path="/Edit-Password" />
        <Route element={<Verify />} path="/Verify" />
        <Route caseSensitive element={<OpenIDCallback />} path="/Callback" />

        {sentryDsn ? <Route caseSensitive element={<SentryFeedback />} path="/Feedback" /> : null}

        <Route caseSensitive element={<Page />} path="/:pageId/*" />
        <Route element={<Navigate to={`/${lang}/${normalize(defaultPageName)}`} />} path="/*" />
      </Routes>
    </MetaProvider>
  );
}
