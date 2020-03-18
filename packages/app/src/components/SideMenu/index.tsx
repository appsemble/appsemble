import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { useMenu } from '../MenuProvider';
import styles from './index.css';

interface SideMenuProps {
  children: React.ReactNode;
}

/**
 * A side menu whose open state is managed by the state hook.
 */

export default function SideMenu({ children }: SideMenuProps): React.ReactElement {
  const history = useHistory();
  const { disable: closeMenu, enabled: isOpen } = useMenu();

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
