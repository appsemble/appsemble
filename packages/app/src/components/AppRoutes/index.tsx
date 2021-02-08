import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { useAppDefinition } from '../AppDefinitionProvider';
import { AppSettings } from '../AppSettings';
import { Login } from '../Login';
import { OpenIDCallback } from '../OpenIDCallback';
import { Page } from '../Page';
import { SentryFeedback } from '../SentryFeedback';
import { useUser } from '../UserProvider';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export function AppRoutes(): ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();

  if (definition == null) {
    return null;
  }

  const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);

  // The `lang` parameter for the parent route is optional. It should be required for subroutes to
  // prevent an infinite routing loop.
  return (
    <Switch>
      <Route exact path="/:lang/Settings" sensitive>
        <AppSettings />
      </Route>
      <Route exact path="/:lang/Login" sensitive>
        <Login />
      </Route>
      <Route exact path="/:lang/Callback" sensitive>
        <OpenIDCallback />
      </Route>
      <Route exact path="/:lang/Feedback" sensitive>
        <SentryFeedback />
      </Route>
      <Route path="/:lang/:pageId">
        <Page />
      </Route>
      <Redirect to={`/:lang/${normalize(defaultPageName)}`} />
    </Switch>
  );
}
