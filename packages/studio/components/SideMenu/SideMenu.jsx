import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './SideMenu.css';

export default class SideMenu extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    isCollapsed: PropTypes.bool.isRequired,
    toggleCollapse: PropTypes.func.isRequired,
  };

  static defaultProps = {
    children: [],
  };

  render() {
    const { children, isCollapsed, toggleCollapse } = this.props;

    return (
      <div className={classNames({ [styles.collapsed]: isCollapsed }, styles.sideMenuContainer)}>
        <aside className={classNames('menu', styles.sideMenu)}>
          <ul className="menu-list">
            {React.Children.map(children, (item, index) => {
              // eslint-disable-next-line react/no-array-index-key
              return <li key={index}>{item}</li>;
            })}
          </ul>
          <button
            className={`button ${styles.collapseButton}`}
            onClick={toggleCollapse}
            type="button"
          >
            <Icon icon={isCollapsed ? 'angle-double-right' : 'angle-double-right'} size="medium" />
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.collapse} />
            </span>
          </button>
        </aside>
      </div>
    );
  }
}
