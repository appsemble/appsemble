import { SideMenuProvider, Toggle } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { apiUrl, appId } from 'app/src/utils/settings';
import { createContext, ReactElement, ReactNode, useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import { useAppDefinition } from '../AppDefinitionProvider';
import { BottomNavigation } from '../BottomNavigation';
import { SideNavigation } from '../SideNavigation';
import { useUser } from '../UserProvider';
import { messages } from './messages';

interface MenuProviderProps {
  children: ReactNode;
}

const Context = createContext<Toggle>(null);

export function useMenu(): Toggle {
  return useContext(Context);
}

export function MenuProvider({ children }: MenuProviderProps): ReactElement {
  const {
    definition: { layout = {}, ...definition },
  } = useAppDefinition();
  const { role, teams } = useUser();

  const checkPagePermissions = (page: PageDefinition): boolean => {
    const roles = page.roles || definition.roles || [];

    return (
      roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
    );
  };

  const pages = definition.pages.filter(
    (page) => !page.parameters && !page.hideFromMenu && checkPagePermissions(page),
  );

  switch (layout?.navigation) {
    case 'bottom':
      return (
        <>
          {children}
          <BottomNavigation pages={pages} />
        </>
      );
    case 'hidden':
      return null;
    default:
      return (
        <SideMenuProvider
          base={<SideNavigation pages={pages} />}
          bottom={
            <div className="py-2 is-flex is-justify-content-center">
              <a
                className="has-text-grey"
                href={`${apiUrl}/apps/${appId}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FormattedMessage {...messages.storeLink} />
              </a>
            </div>
          }
        >
          {children}
        </SideMenuProvider>
      );
  }
}
