import { Button, MenuButton, MenuItem, MenuSection } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { normalize, remap } from '@appsemble/utils';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { appId, sentryDsn } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { BlockMenuItem } from '../MenuProvider';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

interface SideNavigationProps {
  pages: PageDefinition[];
  blockMenus: BlockMenuItem[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ blockMenus, pages }: SideNavigationProps): ReactElement {
  const {
    params: { lang },
    url,
  } = useRouteMatch<{ lang: string }>();
  const { getAppMessage, getMessage } = useAppMessages();
  const {
    definition: { layout, security, ...definition },
  } = useAppDefinition();
  const { isLoggedIn, logout, userInfo } = useUser();

  return (
    <div className="is-flex-grow-1 is-flex-shrink-1">
      <MenuSection>
        {pages.map((page) => {
          const name = getAppMessage({
            id: `pages.${definition.pages.indexOf(page)}`,
            defaultMessage: page.name,
          }).format() as string;
          const navName = page.navTitle
            ? remap(page.navTitle, null, {
                appId,
                appUrl: window.location.origin,
                url: window.location.href,
                getMessage,
                userInfo,
                context: { name },
                locale: lang,
              })
            : name;

          return (
            <MenuItem icon={page.icon} key={page.name} to={`${url}/${normalize(name)}`}>
              {navName}
            </MenuItem>
          );
        })}
        {layout?.settings === 'navigation' && (
          <MenuItem icon="wrench" to={`${url}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        )}
        {layout?.feedback === 'navigation' && sentryDsn && (
          <MenuItem icon="comment" to={`${url}/Feedback`}>
            <FormattedMessage {...messages.feedback} />
          </MenuItem>
        )}
        {security &&
          layout?.login === 'navigation' &&
          (isLoggedIn ? (
            <Button
              className={styles.button}
              icon="sign-out-alt"
              iconSize="medium"
              onClick={logout}
            >
              <FormattedMessage {...messages.logout} />
            </Button>
          ) : (
            <MenuItem icon="sign-in-alt" to={`${url}/Login`}>
              <FormattedMessage {...messages.login} />
            </MenuItem>
          ))}
      </MenuSection>
      {blockMenus.map((menu) => (
        <MenuSection key={menu.path} label={menu.header}>
          {menu.items.map((item) => (
            <Fragment key={`${menu.path}/${item.title}`}>
              <MenuButton
                active={item.active}
                icon={item.icon}
                iconColor={item.iconColor}
                onClick={() => item.onClick()}
              >
                {item.title}
              </MenuButton>
              {item.submenu ? (
                <MenuSection className="mt-2">
                  {item.submenu.map((subItem) => (
                    <MenuButton
                      active={subItem.active}
                      icon={subItem.icon}
                      iconColor={subItem.iconColor}
                      isChild
                      key={`${menu.path}/${item.title}/${subItem.title}`}
                      onClick={() => subItem.onClick()}
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
