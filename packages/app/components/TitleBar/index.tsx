import { Portal, SideMenuButton } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { shouldShowMenu } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { usePage } from '../MenuProvider/index.js';
import { ProfileDropdown } from '../ProfileDropdown/index.js';
import { useUser } from '../UserProvider/index.js';

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
  const { getAppMessage } = useAppMessages();
  const { role, teams } = useUser();
  const { page } = usePage();

  const navigation = (page?.navigation || definition?.layout?.navigation) ?? 'left-menu';
  const appName = (getAppMessage({ id: 'name' }).format() as string) ?? definition.name;

  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className="is-flex is-justify-content-space-between is-flex-grow-1">
        {navigation === 'left-menu' && shouldShowMenu(definition, role, teams) ? (
          <div className="navbar-brand">
            <span>
              <SideMenuButton />
            </span>
          </div>
        ) : null}
        <div className="navbar-brand is-inline-flex is-flex-grow-1">
          <h2 className="navbar-item title is-4">{!hideName && (children || appName)}</h2>
        </div>
        {demoMode ? (
          <div className="tag is-rounded is-warning mx-1 my-1">
            <FormattedMessage {...messages.demo} />
          </div>
        ) : null}
        {definition.layout?.login == null || definition.layout?.login === 'navbar' ? (
          <div className="navbar-end is-flex is-align-items-stretch is-justify-content-flex-end ml-auto">
            <ProfileDropdown />
          </div>
        ) : null}
      </div>
    </Portal>
  );
}
