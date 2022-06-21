import { MetaProvider } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { sentryDsn } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { AppSettings } from '../AppSettings';
import { EditPassword } from '../EditPassword';
import { Login } from '../Login';
import { OpenIDCallback } from '../OpenIDCallback';
import { Page } from '../Page';
import { Register } from '../Register';
import { ResetPassword } from '../ResetPassword';
import { SentryFeedback } from '../SentryFeedback';
import { TeamInvite } from '../TeamInvite';
import { useUser } from '../UserProvider';
import { Verify } from '../Verify';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export function AppRoutes(): ReactElement {
  const { getAppMessage } = useAppMessages();
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();

  if (definition == null) {
    return null;
  }

  const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
  const hasCustomLogin = definition.pages.some((page) => page.name === 'Login');
  const hasCustomRegister = definition.pages.some((page) => page.name === 'Register');

  // The `lang` parameter for the parent route is optional. It should be required for subroutes to
  // prevent an infinite routing loop.
  return (
    <MetaProvider
      description={getAppMessage({ id: 'description' }).format() as string}
      title={getAppMessage({ id: 'name' }).format() as string}
    >
      <Switch>
        <Route exact path="/:lang/Settings" sensitive>
          <AppSettings />
        </Route>

        {!isLoggedIn && !hasCustomLogin ? (
          <Route exact path="/:lang/Login" sensitive>
            <Login />
          </Route>
        ) : null}
        {!isLoggedIn && !hasCustomRegister ? (
          <Route exact path="/:lang/Register" sensitive>
            {hasCustomRegister ? <Page /> : <Register />}
          </Route>
        ) : null}
        <Route exact path="/:lang/Team-Invite" sensitive>
          <TeamInvite />
        </Route>
        <Route exact path="/:lang/Reset-Password" sensitive>
          <ResetPassword />
        </Route>
        <Route exact path="/:lang/Edit-Password" sensitive>
          <EditPassword />
        </Route>
        <Route exact path="/:lang/Verify" sensitive>
          <Verify />
        </Route>
        <Route exact path="/:lang/Callback" sensitive>
          <OpenIDCallback />
        </Route>
        {sentryDsn ? (
          <Route exact path="/:lang/Feedback" sensitive>
            <SentryFeedback />
          </Route>
        ) : null}
        <Route path="/:lang/:pageId">
          <Page />
        </Route>
        <Redirect to={`/:lang/${normalize(defaultPageName)}`} />
      </Switch>
    </MetaProvider>
  );
}
