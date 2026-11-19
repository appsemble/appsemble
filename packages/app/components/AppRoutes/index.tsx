import {
  getPagePathSegment,
  getRouteSegment,
  type MessageGetter,
  translatableRoutes,
  type TranslatableRoute,
} from '@appsemble/lang-sdk';
import { type ComponentChildren, type VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Route, Switch, useParams, useRoute } from 'wouter-preact';

import { Loader } from '../Loader/index.js';
import { MetaProvider } from '../Meta/index.js';
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
import { Redirect } from '../Redirect/index.js';
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
function RouteRedirect({ segment }: RouteRedirectProps): VNode {
  const { lang } = useParams<{ lang: string }>();

  return (
    <Redirect replace to={`/${lang}/${segment}${window.location.search}${window.location.hash}`} />
  );
}

/**
 * Match a built-in route at the given segment after the language.
 *
 * Built-in routes are capitalized and match case sensitively, so they don't match the lowercase path
 * of a page with the same name. The router matches the path as the browser encodes it, and a
 * translated segment is literal text.
 *
 * @param segment The segment of the built-in route.
 * @returns The pattern of the route, which captures the language as `lang`.
 */
function builtinPath(segment: string): RegExp {
  const pattern = encodeURI(segment).replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  return new RegExp(`^/(?<lang>[^/]+)/${pattern}/?$`);
}

interface TranslatedRouteProps {
  readonly element: ComponentChildren;
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
 * @returns The routes to render inside `Switch`.
 */
function translatedRoute({ element, getAppMessage, name }: TranslatedRouteProps): VNode[] {
  const segment = getRouteSegment(name, getAppMessage);
  const routes = [
    <Route key={segment} path={builtinPath(segment)}>
      {element}
    </Route>,
  ];
  if (segment !== name) {
    routes.push(
      <Route key={name} path={builtinPath(name)}>
        <RouteRedirect segment={segment} />
      </Route>,
    );
  }
  return routes;
}

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export function AppRoutes(): VNode | null {
  const { getAppMessage, messagesReady } = useAppMessages();
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup, isLoggedIn } = useAppMember();
  const focusedPage = useRef<string>();
  const { lang } = useParams<{ lang: string }>();

  // The language and page segments identify the page, so switching tabs or page parameters keeps
  // focus where it is.
  const [isPage, pageParams] = useRoute('/:lang/:pageId/*?');
  const pagePath = isPage ? `/${pageParams.lang}/${pageParams.pageId}` : undefined;

  // Client-side navigation keeps focus on the activated link, or drops it when the link unmounts.
  // Move it to the new page, so keyboard and screen reader users continue from its start. Until the
  // user interacts, pages are the first page or redirects from it, which keep the initial focus of
  // the browser.
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || pagePath === focusedPage.current) {
      return;
    }
    if (navigator.userActivation.hasBeenActive) {
      main.focus({ preventScroll: true });
    }
    focusedPage.current = pagePath;
  });

  if (definition == null) {
    return null;
  }

  // The routes and redirects depend on the translated URL segments, so they wait for the messages
  // of the current language.
  if (!messagesReady) {
    return <Loader />;
  }

  const defaultPageSegment = getPagePathSegment(
    { name: getDefaultPageName(isLoggedIn, appMemberRoles, definition) },
    getAppMessage,
  );
  const hasCustomLogin = definition.pages.some((page) => page.name === 'Login');
  const hasCustomRegister = definition.pages.some((page) => page.name === 'Register');

  const elements: Partial<Record<TranslatableRoute, ComponentChildren>> = {
    Settings: <AppSettings />,
    'Group-Invite': <GroupInvite />,
    'App-Invite': <AppInvite />,
    'Reset-Password': <ResetPassword />,
    'Edit-Password': <EditPassword />,
    Verify: <Verify />,
  };
  if (isLoggedIn) {
    // A member who logs in or registers without a redirect is still at the built-in route.
    const defaultPage = <Redirect replace to={`/${lang}/${defaultPageSegment}`} />;
    if (!hasCustomLogin) {
      elements.Login = defaultPage;
    }
    if (!hasCustomRegister) {
      elements.Register = defaultPage;
    }
  } else {
    if (!hasCustomLogin || showDemoLogin) {
      elements.Login = <Login />;
    }
    if (!hasCustomRegister) {
      elements.Register = <Register />;
    }
  }
  if (sentryDsn) {
    elements.Feedback = <SentryFeedback />;
  }

  return (
    <MetaProvider
      description={getAppMessage({ id: 'description' }).format() as string}
      title={getAppMessage({ id: 'name' }).format() as string}
    >
      <Switch>
        <Route path={/^\/[^/]+\/debug\/?$/i}>
          <AppDebug />
        </Route>
        <Route path={builtinPath('Callback')}>
          <OpenIDCallback />
        </Route>

        {translatableRoutes.flatMap((name) =>
          elements[name] ? translatedRoute({ element: elements[name], getAppMessage, name }) : [],
        )}

        <Route path="/:lang/:pageId/*?">
          <Page key={appMemberSelectedGroup?.id ?? 'no-group'} />
        </Route>
        <Route>
          <Redirect to={`/${lang}/${defaultPageSegment}`} />
        </Route>
      </Switch>
    </MetaProvider>
  );
}
