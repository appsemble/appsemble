import { Button, MenuButton, MenuItem, MenuSection } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { normalize, remap } from '@appsemble/utils';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { appId, sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BlockMenuItem } from '../MenuProvider/index.js';
import { useUser } from '../UserProvider/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface SideNavigationProps {
  pages: PageDefinition[];
  blockMenus: BlockMenuItem[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ blockMenus, pages }: SideNavigationProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}`;

  const { getAppMessage, getMessage } = useAppMessages();
  const {
    definition: { layout, security },
  } = useAppDefinition();
  const { formatMessage } = useIntl();
  const { isLoggedIn, logout, userInfo } = useUser();

  return (
    <div className="is-flex-grow-1 is-flex-shrink-1">
      <MenuSection>
        {pages.map((page) => {
          const name = getAppMessage({
            id: `pages.${normalize(page.name)}`,
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
            <MenuItem
              icon={page.icon}
              key={page.name}
              title={navName as string}
              to={`${url}/${normalize(name)}`}
            >
              {navName}
            </MenuItem>
          );
        })}
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
                title={item.title}
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
