import { SideMenuProvider, Toggle } from '@appsemble/react-components';
import { apiUrl, appId } from 'app/src/utils/settings';
import { createContext, ReactElement, ReactNode, useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import { useAppDefinition } from '../AppDefinitionProvider';
import { BottomNavigation } from '../BottomNavigation';
import { SideNavigation } from '../SideNavigation';
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
    definition: { layout = {}, pages },
  } = useAppDefinition();

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
          base={<SideNavigation />}
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
