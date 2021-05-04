import { Button, MenuItem, MenuSection } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { useUser } from '../UserProvider';
import { messages } from './messages';

interface SideNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ pages }: SideNavigationProps): ReactElement {
  const { url } = useRouteMatch();
  const { getMessage } = useAppMessages();
  const {
    definition: { layout, security: showLogin },
  } = useAppDefinition();
  const { isLoggedIn, logout } = useUser();

  return (
    <div className="is-flex-grow-1 is-flex-shrink-1">
      <MenuSection>
        {pages.map((page, index) => {
          const name = getMessage({
            id: `pages.${index}`,
            defaultMessage: page.name,
          }).format() as string;

          return (
            <MenuItem icon={page.icon} key={page.name} to={`${url}/${normalize(name)}`}>
              {name}
            </MenuItem>
          );
        })}
        {layout?.settings === 'navigation' && (
          <MenuItem icon="wrench" to={`${url}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        )}
        {layout?.feedback === 'navigation' && (
          <MenuItem icon="comment" to={`${url}/Feedback`}>
            <FormattedMessage {...messages.feedback} />
          </MenuItem>
        )}

        {showLogin &&
          layout?.login === 'navigation' &&
          (isLoggedIn ? (
            <li>
              <Button icon="sign-out-alt" onClick={logout}>
                <FormattedMessage {...messages.logout} />
              </Button>
            </li>
          ) : (
            <MenuItem icon="sign-in-alt" to={`${url}/Login`}>
              <FormattedMessage {...messages.login} />
            </MenuItem>
          ))}
      </MenuSection>
    </div>
  );
}
