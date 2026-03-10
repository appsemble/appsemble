import { normalize, type PageDefinition, remap } from '@appsemble/lang-sdk';
import {
  Button,
  CollapsibleMenuSection,
  MenuButton,
  MenuItem,
  MenuSection,
} from '@appsemble/react-components';
import { Fragment, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { usePWAInstall } from 'react-use-pwa-install';

import styles from './index.module.css';
import { messages } from './messages.js';
import { checkPagePermissions } from '../../utils/authorization.js';
import { appId, sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { type BlockMenuItem } from '../MenuProvider/index.js';

interface SideNavigationProps {
  readonly pages: PageDefinition[];
  readonly blockMenus: BlockMenuItem[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ blockMenus, pages }: SideNavigationProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}`;

  const { definition } = useAppDefinition();
  const { getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const install = usePWAInstall();
  const {
    definition: { layout, security },
  } = useAppDefinition();
  const { formatMessage } = useIntl();
  const { appMemberInfo, appMemberRole, appMemberSelectedGroup, isLoggedIn, logout } =
    useAppMember();
  const checkPagePermissionsCallback = useCallback(
    (page: PageDefinition): boolean =>
      checkPagePermissions(page, definition, appMemberRole, appMemberSelectedGroup),
    [appMemberRole, appMemberSelectedGroup, definition],
  );

  const createRemapperContext = useCallback(
    (name: string) => ({
      appId,
      appUrl: window.location.origin,
      url: window.location.href,
      getMessage,
      getVariable,
      appMemberInfo,
      context: { name },
      locale: lang!,
      group: appMemberSelectedGroup,
    }),
    [getMessage, getVariable, lang, appMemberInfo, appMemberSelectedGroup],
  );

  const generateNameAndNavName = useCallback(
    (page: PageDefinition): [string, string] => {
      const name = getAppMessage({
        id: `pages.${normalize(page.name)}`,
        defaultMessage: page.name,
      }).format() as string;
      const remapperContext = createRemapperContext(name);
      const navName = page.navTitle
        ? (remap(page.navTitle, null, remapperContext) as string)
        : name;
      return [name, navName];
    },
    [getAppMessage, createRemapperContext],
  );

  const renderMenu = useCallback(
    (internalPages: PageDefinition[]): ReactNode =>
      internalPages
        .filter((page) => !page.hideNavTitle)
        .filter((page) => checkPagePermissionsCallback(page))
        .map((page) => {
          if (page?.type === 'container') {
            const [, navName] = generateNameAndNavName(page);
            return (
              <CollapsibleMenuSection key={page.name}>
                <MenuItem icon={page?.icon} key={page?.name} title={navName}>
                  {navName}
                </MenuItem>
                <MenuSection>{renderMenu(page.pages)}</MenuSection>
              </CollapsibleMenuSection>
            );
          }
          const [name, navName] = generateNameAndNavName(page);
          return (
            <MenuItem
              count={
                page.badgeCount
                  ? (remap(page.badgeCount, null, createRemapperContext(name)) as number)
                  : undefined
              }
              icon={page.icon}
              key={page.name}
              title={navName}
              to={`${url}/${normalize(name)}`}
            >
              {navName}
            </MenuItem>
          );
        }),
    [generateNameAndNavName, checkPagePermissionsCallback, createRemapperContext, url],
  );

  return (
    <div className="is-flex-grow-1 is-flex-shrink-1">
      <MenuSection>
        {renderMenu(pages)}
        {layout?.settings === 'navigation' && (
          <MenuItem icon="wrench" title={formatMessage(messages.settings)} to={`${url}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        )}
        {layout?.feedback === 'navigation' && sentryDsn ? (
          <MenuItem icon="comment" title={formatMessage(messages.feedback)} to={`${url}/Feedback`}>
            <FormattedMessage {...messages.feedback} />
          </MenuItem>
        ) : null}
        {security && layout?.login === 'navigation' ? (
          isLoggedIn ? (
            <Button
              className={styles.button}
              icon="sign-out-alt"
              iconSize="medium"
              onClick={logout}
              title={formatMessage(messages.logout)}
            >
              <FormattedMessage {...messages.logout} />
            </Button>
          ) : (
            <MenuItem icon="sign-in-alt" title={formatMessage(messages.login)} to={`${url}/Login`}>
              <FormattedMessage {...messages.login} />
            </MenuItem>
          )
        ) : null}
        {layout?.install === 'navigation' && install ? (
          <MenuButton
            active={false}
            icon="download"
            onClick={install}
            title={formatMessage(messages.install)}
          >
            <FormattedMessage {...messages.install} />
          </MenuButton>
        ) : null}
        {layout?.debug === 'navigation' ? (
          <MenuItem icon="bug" title={formatMessage(messages.debug)} to={`${url}/Debug`}>
            <FormattedMessage {...messages.debug} />
          </MenuItem>
        ) : null}
      </MenuSection>
      {blockMenus.map((menu) => (
        <MenuSection key={menu.path} label={menu.header}>
          {menu.items.map((item) => (
            <Fragment key={`${menu.path}/${item.title}`}>
              <MenuButton
                active={item.active ?? false}
                icon={item.icon}
                iconColor={item.iconColor}
                onClick={() => item.onClick()}
                title={item.title}
              >
                {item.title}
              </MenuButton>
              {item.submenu ? (
                <MenuSection className="mt-2">
                  {item.submenu.map((subItem) => (
                    <MenuButton
                      active={subItem.active ?? false}
                      icon={subItem.icon}
                      iconColor={subItem.iconColor}
                      isChild
                      key={`${menu.path}/${item.title}/${subItem.title}`}
                      onClick={() => subItem.onClick()}
                      title={subItem.title}
                    >
                      {subItem.title}
                    </MenuButton>
                  ))}
                </MenuSection>
              ) : null}
            </Fragment>
          ))}
        </MenuSection>
      ))}
    </div>
  );
}
