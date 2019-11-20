import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import NavLink from '../NavLink';
import SideMenu from '../SideMenu';
import styles from './AppSideMenu.css';
import messages from './messages';

export default class AppSideMenu extends React.Component {
  static propTypes = {
    app: PropTypes.shape(),
    getApp: PropTypes.func.isRequired,
    initAuth: PropTypes.func.isRequired,
    match: PropTypes.shape().isRequired,
    ready: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    app: undefined,
  };

  state = { isCollapsed: false };

  render() {
    const { app, match } = this.props;
    const { isCollapsed } = this.state;

    return (
      <SideMenu
        isCollapsed={isCollapsed}
        toggleCollapse={() => this.setState({ isCollapsed: !isCollapsed })}
      >
        <NavLink className={styles.menuItem} exact to={`${match.url}/edit`}>
          <Icon icon="edit" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.editor} />
          </span>
        </NavLink>
        <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/resources`}>
          <Icon icon="cubes" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.resources} />
          </span>
        </NavLink>
        {app.definition.resources && !isCollapsed && (
          <ul>
            {Object.keys(app.definition.resources)
              .sort()
              .map(resource => (
                <li key={resource}>
                  <NavLink className={styles.menuItem} to={`${match.url}/resources/${resource}`}>
                    {resource}
                  </NavLink>
                </li>
              ))}
          </ul>
        )}
        <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/notifications`}>
          <Icon icon="paper-plane" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.notifications} />
          </span>
        </NavLink>
        <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/settings`}>
          <Icon icon="cogs" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.settings} />
          </span>
        </NavLink>
      </SideMenu>
    );
  }
}
