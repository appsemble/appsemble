import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './SideMenu.css';

/**
 * A side menu whose open state is managed by the redux state.
 */
export default class SideMenu extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    closeMenu: PropTypes.func.isRequired,
    history: PropTypes.shape().isRequired,
    isOpen: PropTypes.bool.isRequired,
  };

  componentDidMount() {
    const { closeMenu, history } = this.props;

    document.addEventListener('keydown', this.onKeyDown, false);
    this.unlisten = history.listen(closeMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    this.unlisten();
  }

  onKeyDown = event => {
    const { closeMenu } = this.props;

    // Close menu if the Escape key is pressed.
    if (event.keyCode === 27) {
      closeMenu();
    }
  };

  render() {
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
          tabIndex="-1"
        />
      </>
    );
  }
}
