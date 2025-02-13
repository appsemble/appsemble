import {
  CollapsibleMenuSection,
  Input,
  MenuItem,
  MenuSection,
  MetaSwitch,
  useMeta,
  useSideMenu,
} from '@appsemble/react-components';
import { type ComponentType, type ReactNode, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Navigate, Route, useLocation, useNavigate } from 'react-router-dom';

import { docs } from './docs.js';
import { messages } from './messages.js';
import { SearchPage } from './Search/index.js';
import Changelog from '../../../../CHANGELOG.md';
import Contributing from '../../../../CONTRIBUTING.md';
import { useBreadCrumbsDecoration } from '../../components/BreadCrumbsDecoration/index.js';

function formatPath(path: string, base = ''): string {
  return path === '/' ? base : `${base}/${path.replace(/\/$/, '')}`;
}

interface DocProps {
  /**
   * The MDX component to render.
   */
  readonly Component: ComponentType;

  /**
   * The title to display.
   */
  readonly title: string;

  /**
   * The path of the base route.
   */
  readonly path: string;

  /**
   * The path of the base route.
   */
  readonly childRoutes?: DocProps[];
}

function ChildDoc({ Component: Child, title: childTitle }: Partial<DocProps>): ReactNode {
  useMeta(childTitle);
  return <Child />;
}

/**
 * Render documentation in with a breadcrumb.
 */
function Doc({ Component, childRoutes, path, title }: DocProps): ReactNode {
  useMeta(title);

  return (
    <MetaSwitch title={title}>
      <Route element={<Component />} path="/" />
      {childRoutes.map((sub) => (
        <Route
          element={<ChildDoc Component={sub.Component} path={sub.path} title={sub.title} />}
          key={sub.path}
          path={sub.path.replace(path.replace('/*', ''), '')}
        />
      ))}
    </MetaSwitch>
  );
}

/**
 * Render the documentation in the root of the Appsemble repository.
 */
export function DocsRoutes(): ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatMessage } = useIntl();

  const [, setBreadCrumbsDecoration] = useBreadCrumbsDecoration();
  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      <MenuItem end icon="search" to="docs/search">
        <FormattedMessage {...messages.search} />
      </MenuItem>
      {docs
        .filter(({ path }) => path.endsWith('/'))
        .map(({ icon, menu, path, title }) => {
          const subRoutes = docs.filter(
            (subRoute) => subRoute.path !== path && subRoute.path.startsWith(path),
          );
          return [
            <CollapsibleMenuSection key="section-wrapper">
              <MenuItem end icon={icon} key="docs-title" to={formatPath(path, 'docs')}>
                {menu ?? title}
              </MenuItem>
              {subRoutes.length ? (
                <MenuSection key="docs-section">
                  {subRoutes.map((subRoute) => (
                    <MenuItem end key={subRoute.path} to={formatPath(subRoute.path, 'docs')}>
                      {subRoute.menu ?? subRoute.title}
                    </MenuItem>
                  ))}
                </MenuSection>
              ) : null}
            </CollapsibleMenuSection>,
          ];
        })}
      <MenuItem end icon="code-merge" to="docs/contributing">
        <FormattedMessage {...messages.contributing} />
      </MenuItem>
      <MenuItem end icon="scroll" to="docs/changelog">
        <FormattedMessage {...messages.changelog} />
      </MenuItem>
    </MenuSection>,
  );

  useEffect(() => {
    setBreadCrumbsDecoration(
      <Input
        className="my-2"
        defaultValue={decodeURIComponent(location.hash.slice(1))}
        onChange={(event) => {
          navigate({ hash: event.target.value, pathname: 'search' });
        }}
        placeholder={formatMessage(messages.search)}
        type="search"
      />,
    );

    return () => {
      setBreadCrumbsDecoration(null);
    };
  }, [formatMessage, location, navigate, setBreadCrumbsDecoration]);

  return (
    <MetaSwitch title={messages.title}>
      <Route element={<SearchPage />} path="/search" />
      {docs
        .filter(({ path }) => path.endsWith('/'))
        .map(({ Component, path, title }) => (
          <Route
            element={
              <Doc
                childRoutes={docs.filter(
                  ({ path: subPath }) => subPath.startsWith(path) && subPath !== path,
                )}
                Component={Component}
                path={path}
                title={title}
              />
            }
            key={path}
            path={`${path}*`}
          />
        ))}
      <Route element={<Contributing />} path="/contributing" />
      <Route element={<Changelog />} path="/changelog" />
      <Route element={<Navigate to="docs" />} path="*" />
    </MetaSwitch>
  );
}
