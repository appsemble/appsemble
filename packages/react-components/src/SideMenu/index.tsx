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

import { useToggle } from '..';
import { useEventListener } from '../useEventListener';
import styles from './index.module.css';
import { messages } from './messages';

type SideMenuContext = [
  isOpen: boolean,
  toggle: () => void,
  setMenu: Dispatch<SetStateAction<ReactElement>>,
];

const Context = createContext<SideMenuContext>(null);

interface SideMenuProviderProps {
  /**
   * The section of the side menu that’s always visible.
   */
  base: ReactNode;

  /**
   * Content to render at the bottom of the side menu.
   */
  bottom: ReactNode;

  /**
   * The main content to wrap.
   */
  children: ReactNode;
}

/**
 * A wrapper that renders a responsive side menu.
 */
export function SideMenuProvider({ base, bottom, children }: SideMenuProviderProps): ReactElement {
  const { disable, enabled, toggle } = useToggle();
  const [menu, setMenu] = useState<ReactElement>(null);
  const history = useHistory();

  useEffect(() => history.listen(disable), [disable, history]);

  useEventListener(
    globalThis,
    'keydown',
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          disable();
        }
      },
      [disable],
    ),
  );

  return (
    <Context.Provider value={useMemo(() => [enabled, toggle, setMenu], [enabled, toggle])}>
      <div className={styles.sideMenuWrapper}>
        <div
          className={classNames(styles.backdrop, { [styles.closed]: !enabled })}
          onClick={disable}
          role="presentation"
        />
        <aside className={classNames(`menu ${styles.sideMenu}`, { [styles.open]: enabled })}>
          {base}
          {menu}
          {bottom}
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
  const [isOpen, toggle] = useContext(Context);
  const { formatMessage } = useIntl();

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
