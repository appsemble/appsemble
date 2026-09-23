import {
  type AppDefinition,
  bottomNavigationGridArea,
  hasBuiltinPagesGridArea,
  type PageDefinition,
  pageHasGridArea,
} from '@appsemble/lang-sdk';
import { SideMenuProvider } from '@appsemble/react-components';
import { type MenuItem } from '@appsemble/sdk';
import { noop } from '@appsemble/utils';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
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
  /**
   * The definition page that is currently rendered, if any.
   *
   * A definition page sets it while it is rendered, so it is undefined on built-in pages.
   */
  page?: PageDefinition;
  setPage: Dispatch<SetStateAction<PageDefinition | undefined>>;
  setBlockMenu: (menu: BlockMenuItem) => void;

  /**
   * Whether the app renders the bottom navigation on the current page.
   */
  hasBottomNavigation: boolean;
}

const Context = createContext<MenuProviderContext>({
  page: undefined,
  setPage: noop,
  setBlockMenu: noop,
  hasBottomNavigation: false,
});

export function usePage(): MenuProviderContext {
  return useContext(Context);
}

/**
 * Check whether the grid of the current page places an element Appsemble renders itself.
 *
 * A definition page sets the page while it is rendered, so without one the layout of the built-in
 * pages applies.
 *
 * @param definition The app definition to read the built-in page layout from.
 * @param page The definition page that is rendered, if any.
 * @param area The reserved template area to look for.
 * @returns Whether the grid of the page names the area.
 */
function placesGridArea(
  definition: AppDefinition,
  page: PageDefinition | undefined,
  area: string,
): boolean {
  return page
    ? pageHasGridArea(page, area)
    : hasBuiltinPagesGridArea(definition.layout?.builtinPages, area);
}

/**
 * Check whether the grid of the current page places an element Appsemble renders itself.
 *
 * @param area The reserved template area to look for.
 * @returns Whether the grid of the page names the area.
 */
export function usePlacedGridArea(area: string): boolean {
  const { definition } = useAppDefinition();
  const { page } = usePage();
  return placesGridArea(definition, page, area);
}

export function MenuProvider({ children }: MenuProviderProps): ReactNode {
  const { definition: appDefinition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const [currentPage, setCurrentPage] = useState<PageDefinition>();
  const [blockMenus, setBlockMenus] = useState<BlockMenuItem[]>([]);
  const { pathname } = useLocation();
  const setPage = useCallback<MenuProviderContext['setPage']>((p) => {
    setBlockMenus([]);
    setCurrentPage(p);
  }, []);
  const pages = useMemo(
    () => getNavPages(appDefinition, appMemberRoles, appMemberSelectedGroup),
    [appDefinition, appMemberRoles, appMemberSelectedGroup],
  );

  const showMenu = shouldShowMenu(appDefinition, appMemberRoles, appMemberSelectedGroup, pathname);
  // `profileDropdown` only lists a page under the profile dropdown; it does not describe the
  // navigation layout. Fall back to the app navigation so such pages keep the app's menu instead
  // of dropping it (which would leave the title bar's menu button without a provider).
  const pageNavigation =
    currentPage?.navigation === 'profileDropdown' ? undefined : currentPage?.navigation;
  const navigation = pageNavigation || appDefinition.layout?.navigation;
  const effectiveNavigation =
    navigation === 'top' && appDefinition.layout?.hideTitleBar ? 'left-menu' : navigation;
  const hasBottomNavigation = showMenu && effectiveNavigation === 'bottom';

  const value = useMemo<MenuProviderContext>(
    () => ({
      page: currentPage,
      setPage,
      setBlockMenu(menu) {
        setBlockMenus((oldBlockMenus) =>
          [...oldBlockMenus.filter((blockMenu) => blockMenu.path !== menu.path), menu].sort(
            (a, b) => a.path.localeCompare(b.path),
          ),
        );
      },
      hasBottomNavigation,
    }),
    [currentPage, hasBottomNavigation, setPage],
  );

  let navigationElement: ReactNode;

  if (showMenu) {
    switch (effectiveNavigation) {
      case 'bottom':
        // A page whose grid places the bottom navigation renders it inside the grid itself.
        navigationElement = placesGridArea(appDefinition, currentPage, bottomNavigationGridArea) ? (
          children
        ) : (
          <>
            {children}
            <BottomNavigation />
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
