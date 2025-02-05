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
  disable: () => void;
  enable: () => void;
  isClosableOnDesktop: boolean;
  isOpen: boolean;
  setIsClosableOnDesktop: (shownOnDesktop: boolean) => void;
  setMenu: Dispatch<SetStateAction<ReactNode>>;
  toggle: () => void;
}

const Context = createContext<SideMenuContext>({
  disable: noop,
  enable: noop,
  isClosableOnDesktop: false,
  isOpen: false,
  setIsClosableOnDesktop: noop,
  setMenu: noop,
  toggle: noop,
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
  const { disable, enable, enabled, toggle } = useToggle();
  const [menu, setMenu] = useState<ReactNode>(null);
  const [isClosableOnDesktop, setIsClosableOnDesktop] = useState(false);

  const location = useLocation();
  useEffect(() => {
    if (window?.innerWidth < 1024) {
      disable();
    }
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
        () =>
          ({
            disable,
            enable,
            isClosableOnDesktop,
            isOpen: enabled,
            setIsClosableOnDesktop,
            setMenu,
            toggle,
          }) satisfies SideMenuContext,
        [disable, enable, enabled, isClosableOnDesktop, setIsClosableOnDesktop, toggle],
      )}
    >
      <div
        className={classNames(styles.sideMenuWrapper, {
          [styles.open]: enabled,
          [styles.toggleable]: isClosableOnDesktop,
        })}
      >
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <div
          className={classNames(styles.backdrop, 'is-hidden-dekstop', {
            [styles.closed]: !enabled,
          })}
          onClick={disable}
          role="presentation"
        />
        <aside
          className={classNames(`menu ${styles.sideMenu}`, {
            [styles.open]: enabled,
            [styles.toggleable]: isClosableOnDesktop,
          })}
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
  const { isClosableOnDesktop, isOpen, toggle } = useContext(Context);
  const { formatMessage } = useIntl();

  return (
    <button
      aria-label={formatMessage(isOpen ? messages.close : messages.open)}
      className={classNames(
        'navbar-burger',
        {
          'is-active': isOpen,
          [styles.toggleable]: isClosableOnDesktop,
        },
        styles.button,
      )}
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
 * Make the side menu closable on the page this hook is used in.
 */
export function useClosableOnDesktopSideMenu(): void {
  const { enable, setIsClosableOnDesktop: setClosableOnDesktop } = useContext(Context);
  useEffect(() => {
    if (window?.innerWidth >= 1024) {
      enable();
    }
    setClosableOnDesktop(true);
    return () => setClosableOnDesktop(false);
  }, [enable, setClosableOnDesktop]);
}

/**
 * Access the current state of the side menu.
 *
 * @returns The state of the side menu.
 */
export function useSideMenuState(): Pick<SideMenuContext, 'disable' | 'isOpen' | 'toggle'> {
  const { disable, isOpen, toggle } = useContext(Context);
  return { disable, isOpen, toggle };
}
