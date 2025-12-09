import { normalize, remap, type RemapperContext } from '@appsemble/lang-sdk';
import { Portal, SideMenuButton } from '@appsemble/react-components';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { shouldShowMenu } from '../../utils/layout.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { GroupDropdown } from '../GroupDropdown/index.js';
import { usePage } from '../MenuProvider/index.js';
import { ProfileDropdown } from '../ProfileDropdown/index.js';

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
  const { appMemberGroups, appMemberInfo, appMemberRole, appMemberSelectedGroup, isLoggedIn } =
    useAppMember();
  const { getVariable } = useAppVariables();
  const { page } = usePage();
  const { getAppMessage, getMessage } = useAppMessages();
  const { lang: locale } = useParams();
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

  const navigation = (page?.navigation || definition?.layout?.navigation) ?? 'left-menu';
  const appName = (getAppMessage({ id: 'name' }).format() as string) ?? definition.name;

  const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRole, definition);
  const displayAppName = (definition?.layout?.titleBarText || 'pageName') === 'appName';

  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className="is-flex is-justify-content-space-between is-flex-grow-1">
        {navigation === 'left-menu' &&
        shouldShowMenu(definition, appMemberRole, appMemberSelectedGroup) ? (
          <div className="navbar-brand">
            <span>
              <SideMenuButton />
            </span>
          </div>
        ) : null}
        <div className="navbar-brand is-inline-flex is-flex-grow-1">
          {(definition.layout?.logo?.position || 'hidden') === 'navbar' ? (
            <Link to={`/${locale}/${normalize(defaultPageName)}`}>
              <img
                alt="app-logo"
                className={styles.logo}
                src={`${apiUrl}/api/apps/${appId}/assets/${definition.layout?.logo?.asset || 'logo'}`}
              />
            </Link>
          ) : null}
          <h2 className="navbar-item title is-4 mb-0">
            {displayAppName ? appName : !hideName && (children || appName)}
          </h2>
          {headerTagHide || !headerTagText ? null : (
            <span className="tag is-warning is-rounded">{headerTagText}</span>
          )}
        </div>
        {demoMode ? (
          <div className="tag is-rounded is-warning mx-1 my-1">
            <FormattedMessage {...messages.demo} />
          </div>
        ) : null}
        <div className={styles.dropdowns}>
          {appMemberGroups.length ? (
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
      </div>
    </Portal>
  );
}
