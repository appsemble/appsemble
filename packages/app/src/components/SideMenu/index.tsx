import { useEventListener } from '@appsemble/react-components';
import classNames from 'classnames';
import {
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useHistory } from 'react-router-dom';

import { useMenu } from '../MenuProvider';
import styles from './index.module.css';

interface SideMenuProps {
  children: ReactNode;
}

/**
 * A side menu whose open state is managed by the state hook.
 */
export function SideMenu({ children }: SideMenuProps): ReactElement {
  const history = useHistory();
  const { disable: closeMenu, enabled: isOpen } = useMenu();

  const onKeyDown = useCallback(
    (event: KeyboardEvent | ReactKeyboardEvent): void => {
      // Close menu if the Escape key is pressed.
      if (event.keyCode === 27) {
        closeMenu();
      }
    },
    [closeMenu],
  );

  useEventListener(document, 'keydown', onKeyDown, false);

  useEffect(() => history.listen(closeMenu), [closeMenu, history]);

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
