import { SideMenuProvider } from '@appsemble/react-components';
import { type MenuItem } from '@appsemble/sdk';
import { type PageDefinition } from '@appsemble/types';
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

import { messages } from './messages.js';
import { checkPagePermissions } from '../../utils/authorization.js';
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
  const { appMemberRole, appMemberSelectedGroup } = useAppMember();
  const [page, setPage] = useState<PageDefinition>();
  const [blockMenus, setBlockMenus] = useState<BlockMenuItem[]>([]);
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

  const pages = appDefinition.pages.filter(
    (pageDefinition) =>
      !pageDefinition.parameters &&
      !pageDefinition.hideNavTitle &&
      checkPagePermissions(pageDefinition, appDefinition, appMemberRole, appMemberSelectedGroup),
  );

  if (!pages.length) {
    // Don’t display anything if there are no pages to display.
    return children;
  }

  let navigationElement: ReactNode;
  const navigation = page?.navigation || appDefinition.layout?.navigation;

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

  return <Context.Provider value={value}>{navigationElement}</Context.Provider>;
}
