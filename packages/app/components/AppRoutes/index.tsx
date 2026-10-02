import {
  getPagePathSegment,
  getRouteSegment,
  type MessageGetter,
  translatableRoutes,
  type TranslatableRoute,
} from '@appsemble/lang-sdk';
import { Loader, MetaProvider } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { AppDebug } from '../AppDebug/index.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { AppInvite } from '../AppInvite/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { AppSettings } from '../AppSettings/index.js';
import { EditPassword } from '../EditPassword/index.js';
import { GroupInvite } from '../GroupInvite/index.js';
import { Login } from '../Login/index.js';
import { OpenIDCallback } from '../OpenIDCallback/index.js';
import { Page } from '../Page/index.js';
import { Register } from '../Register/index.js';
import { ResetPassword } from '../ResetPassword/index.js';
import { SentryFeedback } from '../SentryFeedback/index.js';
import { Verify } from '../Verify/index.js';

interface RouteRedirectProps {
  /**
   * The URL segment of the built-in route in the current language.
   */
  readonly segment: string;
}

/**
 * Redirect the English path of a translated built-in route to its translated path.
 *
 * Email links built by the server use the English path, so they keep working in every language.
 */
function RouteRedirect({ segment }: RouteRedirectProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const { hash, search } = useLocation();

  return <Navigate replace to={{ hash, pathname: `/${lang}/${segment}`, search }} />;
}

interface TranslatedRouteProps {
  readonly element: ReactNode;
  readonly getAppMessage: MessageGetter;
  readonly name: TranslatableRoute;
}

/**
 * Create the routes of a translatable built-in route.
 *
 * The route is mounted at its segment in the current language. When that segment differs from the
 * English name, the English path redirects to it.
 *
 * @param props The element to mount, the message getter, and the English name of the route.
 * @returns The routes to render inside `Routes`.
 */
function translatedRoute({ element, getAppMessage, name }: TranslatedRouteProps): ReactNode[] {
  const segment = getRouteSegment(name, getAppMessage);
  const routes = [<Route caseSensitive element={element} key={segment} path={`/${segment}`} />];
  if (segment !== name) {
    routes.push(
      <Route
        caseSensitive
        element={<RouteRedirect segment={segment} />}
        key={name}
        path={`/${name}`}
      />,
    );
  }
  return routes;
}

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export function AppRoutes(): ReactNode {
  const { getAppMessage, messagesReady } = useAppMessages();
  const { definition } = useAppDefinition();
  const { appMemberRoles, isLoggedIn } = useAppMember();

  if (definition == null) {
    return null;
  }

  // The routes and redirects depend on the translated URL segments, so they wait for the messages
  // of the current language.
  if (!messagesReady) {
    return <Loader />;
  }

  const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRoles, definition);
  const hasCustomLogin = definition.pages.some((page) => page.name === 'Login');
  const hasCustomRegister = definition.pages.some((page) => page.name === 'Register');

  const elements: Partial<Record<TranslatableRoute, ReactNode>> = {
    Settings: <AppSettings />,
    'Group-Invite': <GroupInvite />,
    'App-Invite': <AppInvite />,
    'Reset-Password': <ResetPassword />,
    'Edit-Password': <EditPassword />,
    Verify: <Verify />,
  };
  if (!isLoggedIn && (!hasCustomLogin || showDemoLogin)) {
    elements.Login = <Login />;
  }
  if (!isLoggedIn && !hasCustomRegister) {
    elements.Register = <Register />;
  }
  if (sentryDsn) {
    elements.Feedback = <SentryFeedback />;
  }

  return (
    <MetaProvider
      description={getAppMessage({ id: 'description' }).format() as string}
      title={getAppMessage({ id: 'name' }).format() as string}
    >
      <Routes>
        <Route element={<AppDebug />} path="/debug" />
        <Route caseSensitive element={<OpenIDCallback />} path="/Callback" />

        {translatableRoutes.flatMap((name) =>
          elements[name] ? translatedRoute({ element: elements[name], getAppMessage, name }) : [],
        )}

        <Route caseSensitive element={<Page />} path="/:pageId/*" />
        <Route
          element={<Navigate to={getPagePathSegment({ name: defaultPageName }, getAppMessage)} />}
          path="*"
        />
      </Routes>
    </MetaProvider>
  );
}
