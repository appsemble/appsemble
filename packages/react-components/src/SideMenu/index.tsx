import classNames from 'classnames';
import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages';

type SideMenuContext = [
  isOpen: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  setMenu: Dispatch<SetStateAction<ReactElement>>,
];

const Context = createContext<SideMenuContext>(null);

interface SideMenuProviderProps {
  /**
   * The section of the side menu that’s always visible.
   */
  base: ReactNode;

  /**
   * The main content to wrap.
   */
  children: ReactNode;
}

/**
 * A wrapper that renders a responsive side menu.
 */
export function SideMenuProvider({ base, children }: SideMenuProviderProps): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const [menu, setMenu] = useState<ReactElement>(null);
  const history = useHistory();

  useEffect(() => history.listen(() => setOpen(false)), [history]);

  return (
    <Context.Provider value={useMemo(() => [isOpen, setOpen, setMenu], [isOpen])}>
      <div className={`px-3 py-3 ${styles.sideMenuWrapper}`}>
        <aside className={classNames(`menu ${styles.sideMenu}`, { [styles.open]: isOpen })}>
          {base}
          {menu}
        </aside>
        {children}
      </div>
    </Context.Provider>
  );
}

/**
 * A Bulma styled menu toggle.
 */
export function SideMenuButton(): ReactElement {
  const [isOpen, setOpen] = useContext(Context);
  const { formatMessage } = useIntl();

  const toggle = useCallback(() => {
    setOpen((value) => !value);
  }, [setOpen]);

  return (
    <button
      aria-label={formatMessage(isOpen ? messages.close : messages.open)}
      className={classNames('navbar-burger', { 'is-active': isOpen }, styles.button)}
      onClick={toggle}
      type="button"
    >
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </button>
  );
}

/**
 * Add a section to the side menu.
 *
 * @param menu - The menu section to add to the side navigation.
 */
export function useSideMenu(menu: ReactElement): void {
  const [, , setMenu] = useContext(Context);

  useEffect(() => {
    setMenu(menu);

    return () => setMenu(null);
  }, [menu, setMenu]);
}
