import { noop } from '@appsemble/utils';
import classNames from 'classnames';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useToggle } from '../index.js';
import { useEventListener } from '../useEventListener.js';

interface SideMenuContext {
  isOpen: boolean;
  toggle: () => void;
  disable: () => void;
  setMenu: Dispatch<SetStateAction<ReactNode>>;
}

const Context = createContext<SideMenuContext>({
  isOpen: false,
  toggle: noop,
  disable: noop,
  setMenu: noop,
});

interface SideMenuProviderProps {
  /**
   * The section of the side menu that’s always visible.
   */
  readonly base: ReactNode;

  /**
   * Content to render at the bottom of the side menu.
   */
  readonly bottom: ReactNode;

  /**
   * The main content to wrap.
   */
  readonly children: ReactNode;
}

/**
 * A wrapper that renders a responsive side menu.
 */
export function SideMenuProvider({ base, bottom, children }: SideMenuProviderProps): ReactNode {
  const { disable, enabled, toggle } = useToggle();
  const [menu, setMenu] = useState<ReactNode>(null);

  const location = useLocation();
  useEffect(() => {
    disable();
  }, [disable, location]);

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
    <Context.Provider
      value={useMemo(
        () => ({
          isOpen: enabled,
          disable,
          toggle,
          setMenu,
        }),
        [enabled, disable, toggle],
      )}
    >
      <div
        className={classNames(
          styles.sideMenuWrapper,
          { [styles.open]: enabled },
          {
            [styles.gui]: location.pathname.match(/(?<=\/)gui(?=\/)/),
          },
          { [styles.code]: location.pathname.match(/edit/) && location.hash.length > 0 },
        )}
      >
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <div
          className={classNames(
            styles.backdrop,
            { [styles.closed]: !enabled },
            { [styles.code]: location.pathname.match(/edit/) && location.hash.length > 0 },
            { [styles.gui]: location.pathname.match(/(?<=\/)gui(?=\/)/) },
          )}
          onClick={disable}
          role="presentation"
        />
        <aside
          className={classNames(
            `menu ${styles.sideMenu}`,
            { [styles.open]: enabled },
            { [styles.code]: location.pathname.match(/edit/) && location.hash.length > 0 },
            { [styles.gui]: location.pathname.match(/(?<=\/)gui(?=\/)/) },
          )}
        >
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
export function SideMenuButton(): ReactNode {
  const { isOpen, toggle } = useContext(Context);
  const { formatMessage } = useIntl();
  const location = useLocation();

  return /edit/.test(location.pathname) && location.hash.length > 0 ? (
    <button
      aria-label={formatMessage(isOpen ? messages.close : messages.open)}
      className={classNames('navbar-burger', { 'is-active': isOpen }, styles.button, styles.code)}
      onClick={toggle}
      type="button"
    >
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </button>
  ) : /(?<=\/)gui(?=\/)/.test(location.pathname) ? (
    <button
      aria-label={formatMessage(isOpen ? messages.close : messages.open)}
      className={classNames('navbar-burger', { 'is-active': isOpen }, styles.button, styles.gui)}
      onClick={toggle}
      type="button"
    >
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </button>
  ) : (
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
 * @param menu The menu section to add to the side navigation.
 */
export function useSideMenu(menu: ReactNode): void {
  const { setMenu } = useContext(Context);

  useEffect(() => {
    setMenu(menu);

    return () => setMenu(null);
  }, [menu, setMenu]);
}

/**
 * Access the current state of the side menu.
 *
 * @returns The state of the side menu.
 */
export function useSideMenuState(): Pick<SideMenuContext, 'disable' | 'isOpen' | 'toggle'> {
  const { disable, isOpen, toggle } = useContext(Context);
  return { isOpen, disable, toggle };
}
