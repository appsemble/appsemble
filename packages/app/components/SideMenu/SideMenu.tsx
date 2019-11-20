import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import styles from './SideMenu.css';

export interface SideMenuProps {
  isOpen: boolean;
  children: React.ReactChildren;
  closeMenu: () => void;
}

/**
 * A side menu whose open state is managed by the redux state.
 */

export default function SideMenu({
  children,
  closeMenu,
  history,
  isOpen,
}: SideMenuProps & RouteComponentProps): React.ReactElement {
  const onKeyDown = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent): void => {
      // Close menu if the Escape key is pressed.
      if (event.keyCode === 27) {
        closeMenu();
      }
    },
    [closeMenu],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown, false);
    const unlisten = history.listen(closeMenu);

    return () => {
      document.removeEventListener('keydown', onKeyDown, false);
      unlisten();
    };
  }, [closeMenu, history, onKeyDown]);

  return (
    <>
      <aside
        className={classNames(styles.menu, {
          [styles.active]: isOpen,
        })}
      >
        {children}
      </aside>
      <div
        aria-hidden
        className={classNames(styles.backdrop, { [styles.active]: isOpen })}
        onClick={closeMenu}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      />
    </>
  );
}
