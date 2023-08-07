import { SideMenuProvider } from '@appsemble/react-components';
import { type MenuItem } from '@appsemble/sdk';
import { type PageDefinition } from '@appsemble/types';
import { checkAppRole, noop } from '@appsemble/utils';
import {
  createContext,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { BottomNavigation } from '../BottomNavigation/index.js';
import { SideNavigation } from '../SideNavigation/index.js';
import { useUser } from '../UserProvider/index.js';

export interface BlockMenuItem {
  path: string;
  header?: string;
  items: MenuItem[];
}

interface MenuProviderProps {
  readonly children: ReactNode;
}

interface MenuProviderContext {
  page: PageDefinition;
  setPage: Dispatch<SetStateAction<PageDefinition>>;
  setBlockMenu: (menu: BlockMenuItem) => void;
}

const Context = createContext<MenuProviderContext>({
  page: undefined,
  setPage: noop,
  setBlockMenu: noop,
});

export function usePage(): MenuProviderContext {
  return useContext(Context);
}

export function MenuProvider({ children }: MenuProviderProps): ReactElement {
  const {
    definition: { layout = {}, ...definition },
  } = useAppDefinition();
  const { role, teams } = useUser();
  const [page, setPage] = useState<PageDefinition>();
  const [blockMenus, setBlockMenus] = useState<BlockMenuItem[]>([]);
  const value = useMemo<MenuProviderContext>(
    () => ({
      page,
      setPage(p) {
        setBlockMenus([]);
        setPage(p);
      },
      setBlockMenu(menu) {
        setBlockMenus((oldBlockMenus) =>
          [...oldBlockMenus.filter((blockMenu) => blockMenu.path !== menu.path), menu].sort(
            (a, b) => a.path.localeCompare(b.path),
          ),
        );
      },
    }),
    [page],
  );

  const checkPagePermissions = (p: PageDefinition): boolean => {
    const roles = p.roles || definition.roles || [];

    return (
      roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
    );
  };

  const pages = definition.pages.filter(
    (p) => !p.parameters && !p.hideNavTitle && checkPagePermissions(p),
  );

  if (!pages.length) {
    // Don’t display anything if there are no pages to display.
    return children as ReactElement;
  }

  let navigationElement: ReactElement;
  const navigation = page?.navigation || layout?.navigation;

  switch (navigation) {
    case 'bottom':
      navigationElement = (
        <>
          {children}
          <BottomNavigation pages={pages} />
        </>
      );
      break;
    case 'hidden':
      navigationElement = children as ReactElement;
      break;
    default:
      navigationElement = (
        <SideMenuProvider
          base={<SideNavigation blockMenus={blockMenus} pages={pages} />}
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

  return <Context.Provider value={value}>{navigationElement}</Context.Provider>;
}
