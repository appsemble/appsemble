import { type PageDefinition } from '@appsemble/lang-sdk';
import { SideMenuProvider } from '@appsemble/react-components';
import { type MenuItem } from '@appsemble/sdk';
import { noop } from '@appsemble/utils';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';

import { messages } from './messages.js';
import { getNavPages, shouldShowMenu } from '../../utils/layout.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { BottomNavigation } from '../BottomNavigation/index.js';
import { SideNavigation } from '../SideNavigation/index.js';

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
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  page: undefined,
  setPage: noop,
  setBlockMenu: noop,
});

export function usePage(): MenuProviderContext {
  return useContext(Context);
}

export function MenuProvider({ children }: MenuProviderProps): ReactNode {
  const { definition: appDefinition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const [page, setPage] = useState<PageDefinition>();
  const [blockMenus, setBlockMenus] = useState<BlockMenuItem[]>([]);
  const { pathname } = useLocation();
  const value = useMemo<MenuProviderContext>(
    () => ({
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      page,
      setPage(p) {
        setBlockMenus([]);
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
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

  const pages = getNavPages(appDefinition, appMemberRoles, appMemberSelectedGroup);

  let navigationElement: ReactNode;
  const showMenu = shouldShowMenu(appDefinition, appMemberRoles, appMemberSelectedGroup, pathname);

  if (showMenu) {
    // `profileDropdown` only lists a page under the profile dropdown; it does not describe the
    // navigation layout. Fall back to the app navigation so such pages keep the app's menu instead
    // of dropping it (which would leave the title bar's menu button without a provider).
    const pageNavigation = page?.navigation === 'profileDropdown' ? undefined : page?.navigation;
    const navigation = pageNavigation || appDefinition.layout?.navigation;
    const effectiveNavigation =
      navigation === 'top' && appDefinition.layout?.hideTitleBar ? 'left-menu' : navigation;

    switch (effectiveNavigation) {
      case 'bottom':
        navigationElement = (
          <>
            {children}
            <BottomNavigation pages={pages} />
          </>
        );
        break;
      case 'top':
      case 'hidden':
        navigationElement = children;
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
  } else {
    navigationElement = children;
  }

  return <Context.Provider value={value}>{navigationElement}</Context.Provider>;
}
