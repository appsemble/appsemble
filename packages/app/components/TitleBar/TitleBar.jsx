import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Portal from '../Portal';
import SideMenuButton from '../SideMenuButton';
import styles from './TitleBar.css';

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export default class TitleBar extends React.Component {
  static propTypes = {
    /**
     * The title to render.
     */
    children: PropTypes.node,
  };

  static defaultProps = {
    children: 'Appsemble',
  };

  render() {
    const { children } = this.props;

    return (
      <Portal className={styles.navbar} element={document.getElementsByClassName('navbar')[0]}>
        <div className={classNames('navbar-brand', styles.brand)}>
          <span className="navbar-item">
            <SideMenuButton />
          </span>
          <h2 className="navbar-item title">{children}</h2>
        </div>
      </Portal>
    );
  }
}
