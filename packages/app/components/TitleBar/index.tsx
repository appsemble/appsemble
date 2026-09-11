import { normalize, remap, type RemapperContext } from '@appsemble/lang-sdk';
import { Portal, SideMenuButton } from '@appsemble/react-components';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { shouldHideGroupDropdown, shouldShowMenu } from '../../utils/layout.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { GroupDropdown } from '../GroupDropdown/index.js';
import { usePage } from '../MenuProvider/index.js';
import { ProfileDropdown } from '../ProfileDropdown/index.js';
import { DEFAULT_BREAKPOINTS, useGridCss } from '../PageGridProvider/index.js';
import { TopNavigation } from '../TopNavigation/index.js';

// Breakpoints the author leaves undefined fall back to a single-row navbar layout so every rendered
// area still has a matching grid slot instead of being orphaned by the generic default template.
const NAVBAR_DEFAULT_LAYOUT_WITH_LOGO = {
  columns: 4,
  template: ['logo name navigation controls'],
};

const NAVBAR_DEFAULT_LAYOUT_WITHOUT_LOGO = {
  columns: 3,
  template: ['name navigation controls'],
};

interface AppBarProps {
  readonly children?: ReactNode;
  readonly hideName?: boolean;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export function AppBar({ children, hideName }: AppBarProps): ReactNode {
  const { definition, demoMode } = useAppDefinition();
  const { appMemberGroups, appMemberInfo, appMemberRoles, appMemberSelectedGroup, isLoggedIn } =
    useAppMember();
  const { getVariable } = useAppVariables();
  const { page } = usePage();
  const { getAppMessage, getMessage } = useAppMessages();
  const { lang: locale } = useParams();
  const { pathname } = useLocation();
  const logoInNavbar = (definition.layout?.logo?.position || 'hidden') === 'navbar';
  const navbarGridClassName = useGridCss({
    BREAKPOINTS: { ...DEFAULT_BREAKPOINTS, ...definition.layout?.breakpoints },
    classNamePrefix: 'navbar-grid',
    defaultLayout: logoInNavbar
      ? NAVBAR_DEFAULT_LAYOUT_WITH_LOGO
      : NAVBAR_DEFAULT_LAYOUT_WITHOUT_LOGO,
    layout: definition.layout?.navbar,
    spacingProperty: '--appsemble-navbar-grid-spacing-unit',
  });
  const remapperContext = useMemo(
    () =>
      ({
        appId,
        appUrl: window.location.origin,
        url: window.location.href,
        getMessage,
        getVariable,
        appMemberInfo,
        context: { name: page?.name },
        locale,
        group: appMemberSelectedGroup,
      }) as RemapperContext,
    [appMemberInfo, appMemberSelectedGroup, getMessage, getVariable, locale, page],
  );
  const headerTagText = remap(
    definition.layout?.headerTag?.text ?? null,
    {},
    remapperContext,
  ) as string;
  const headerTagHide = remap(definition.layout?.headerTag?.hide ?? null, {}, remapperContext);

  const hideGroupDropdownForMember = shouldHideGroupDropdown(
    definition.layout?.hideGroupDropdown,
    appMemberRoles,
  );

  // `profileDropdown` only lists a page under the profile dropdown; it does not describe how the
  // navbar renders. Fall back to the app navigation so such pages keep the app's navbar layout
  // instead of collapsing into the default single-row bar.
  const pageNavigation = page?.navigation === 'profileDropdown' ? undefined : page?.navigation;
  const navigation = (pageNavigation || definition?.layout?.navigation) ?? 'left-menu';
  const appName = (getAppMessage({ id: 'name' }).format() as string) ?? definition.name;

  const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRoles, definition);
  const displayAppName = (definition?.layout?.titleBarText || 'pageName') === 'appName';

  if (definition.layout?.hideTitleBar) {
    return null;
  }

  const showMenu = shouldShowMenu(definition, appMemberRoles, appMemberSelectedGroup, pathname);
  const topNavigation = navigation === 'top' && showMenu;

  // `layout.stackedHeader` gives the logo its own centered row above the top navigation.
  const stackedTopHeader = topNavigation && definition.layout?.stackedHeader === true;

  const logoNode = logoInNavbar ? (
    <Link to={`/${locale}/${normalize(defaultPageName)}`}>
      <img
        alt="app-logo"
        className={styles.logo}
        src={`${apiUrl}/api/apps/${appId}/assets/${definition.layout?.logo?.asset || 'logo'}`}
      />
    </Link>
  ) : null;

  const nameNode = (
    <h2 className="navbar-item title is-4 mb-0">
      {displayAppName ? appName : !hideName && (children || appName)}
    </h2>
  );

  const headerTagNode =
    headerTagHide || !headerTagText ? null : (
      <span className="tag is-warning is-rounded">{headerTagText}</span>
    );

  const demoNode = demoMode ? (
    <div className="tag is-rounded is-warning mx-1 my-1">
      <FormattedMessage {...messages.demo} />
    </div>
  ) : null;

  const dropdownsNode = (
    <div className="is-flex">
      {appMemberGroups.length && !hideGroupDropdownForMember ? (
        <div className="navbar-end is-flex is-align-items-stretch is-justify-content-flex-end ml-auto">
          <GroupDropdown />
        </div>
      ) : null}
      {definition.layout?.login == null || definition.layout?.login === 'navbar' ? (
        <div className="navbar-end is-flex is-align-items-stretch is-justify-content-flex-end ml-auto">
          <ProfileDropdown />
        </div>
      ) : null}
    </div>
  );

  const navbar = document.getElementsByClassName('navbar')[0];

  if (topNavigation && navbarGridClassName) {
    return (
      <Portal element={navbar}>
        <div className={`${styles.navbarGrid} ${navbarGridClassName}`}>
          {logoNode ? (
            <div className={styles.logoArea} data-grid-area="logo">
              {logoNode}
            </div>
          ) : null}
          <div className={styles.nameArea} data-grid-area="name">
            {nameNode}
            {headerTagNode}
          </div>
          <div data-grid-area="navigation">
            <TopNavigation />
          </div>
          <div className={styles.controlsArea} data-grid-area="controls">
            {demoNode}
            {dropdownsNode}
          </div>
        </div>
      </Portal>
    );
  }

  if (stackedTopHeader) {
    return (
      <Portal element={navbar}>
        <div className={`${styles.brandColumn} is-flex is-flex-direction-column is-flex-grow-1`}>
          {logoNode ? (
            <div
              className={`${styles.brandRow} is-flex is-align-items-center is-justify-content-center py-2`}
            >
              {logoNode}
            </div>
          ) : null}
          <div
            className={`${styles.navRow} is-flex is-align-items-center is-justify-content-space-between`}
          >
            <div className="is-flex is-align-items-center">
              {nameNode}
              {headerTagNode}
            </div>
            <div className={`${styles.navEnd} is-flex is-align-items-center`}>
              <TopNavigation />
              {demoNode}
              {dropdownsNode}
            </div>
          </div>
        </div>
      </Portal>
    );
  }

  return (
    <Portal element={navbar}>
      <div className="is-flex is-justify-content-space-between is-flex-grow-1">
        {navigation === 'left-menu' && showMenu ? (
          <div className="navbar-brand">
            <span>
              <SideMenuButton />
            </span>
          </div>
        ) : null}
        <div className="navbar-brand is-inline-flex is-flex-grow-1">
          {logoNode}
          {nameNode}
          {headerTagNode}
        </div>
        {topNavigation ? <TopNavigation /> : null}
        {demoNode}
        {dropdownsNode}
      </div>
    </Portal>
  );
}
