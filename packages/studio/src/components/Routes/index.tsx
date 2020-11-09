import React, { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { enableRegistration } from '../../utils/settings';
import { AnonymousRoute } from '../AnonymousRoute';
import { AppContext } from '../AppContext';
import { AppList } from '../AppList';
import { BlockDetails } from '../BlockDetails';
import { BlockList } from '../BlockList';
import { Docs } from '../Docs';
import { EditPassword } from '../EditPassword';
import { ForwardOAuth2Login } from '../ForwardOAuth2Login';
import { Login } from '../Login';
import { OAuth2Callback } from '../OAuth2Callback';
import { OpenIDLogin } from '../OpenIDLogin';
import { OrganizationInvite } from '../OrganizationInvite';
import { ProtectedRoute } from '../ProtectedRoute';
import { Register } from '../Register';
import { ResetPassword } from '../ResetPassword';
import { Settings } from '../Settings';
import { VerifyEmail } from '../VerifyEmail';

/**
 * Render all top level routes.
 */
export function Routes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={`${path}/apps`}>
        <AppList />
      </Route>
      <Route exact path={`${path}/blocks`}>
        <BlockList />
      </Route>
      <Route exact path={`${path}/blocks/@:organization/:blockName/:version?`}>
        <BlockDetails />
      </Route>
      <ProtectedRoute path={`${path}/settings`}>
        <Settings />
      </ProtectedRoute>
      <ProtectedRoute exact path={`${path}/connect/authorize`}>
        <OpenIDLogin />
      </ProtectedRoute>
      <Route exact path={`${path}/connect/authorize/:type/:id`}>
        <ForwardOAuth2Login />
      </Route>
      <Route path={`${path}/apps/:id(\\d+)`}>
        <AppContext />
      </Route>
      <AnonymousRoute exact path={`${path}/edit-password`}>
        <EditPassword />
      </AnonymousRoute>
      <Route exact path={`${path}/organization-invite`}>
        <OrganizationInvite />
      </Route>
      <Route exact path={`${path}/verify`}>
        <VerifyEmail />
      </Route>
      <Route exact path={`${path}/callback`}>
        <OAuth2Callback />
      </Route>
      <AnonymousRoute exact path={`${path}/login`}>
        <Login />
      </AnonymousRoute>
      {enableRegistration && (
        <AnonymousRoute exact path={`${path}/register`}>
          <Register />
        </AnonymousRoute>
      )}
      <Route exact path={`${path}/reset-password`}>
        <ResetPassword />
      </Route>
      <Route exact path={`${path}/edit-password`}>
        <EditPassword />
      </Route>
      <Route exact path={`${path}/verify`}>
        <VerifyEmail />
      </Route>
      <Route path={`${path}/docs`}>
        <Docs />
      </Route>
      <Redirect to={`${path}/apps`} />
    </Switch>
  );
}
