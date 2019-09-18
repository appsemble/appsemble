import classNames from 'classnames';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import styles from './SideMenu.css';

export interface SideMenuProps {
  isOpen: boolean;
  closeMenu: () => void;
}

/**
 * A side menu whose open state is managed by the redux state.
 */
export default class SideMenu extends React.Component<SideMenuProps & RouteComponentProps> {
  unlisten: () => void;

  componentDidMount(): void {
    const { closeMenu, history } = this.props;

    document.addEventListener('keydown', this.onKeyDown, false);
    this.unlisten = history.listen(closeMenu);
  }

  componentWillUnmount(): void {
    document.removeEventListener('keydown', this.onKeyDown, false);
    this.unlisten();
  }

  onKeyDown = (event: KeyboardEvent | React.KeyboardEvent): void => {
    const { closeMenu } = this.props;

    // Close menu if the Escape key is pressed.
    if (event.keyCode === 27) {
      closeMenu();
    }
  };

  render(): React.ReactNode {
    const { children, closeMenu, isOpen } = this.props;

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
          onKeyDown={this.onKeyDown}
          tabIndex={-1}
        />
      </>
    );
  }
}
