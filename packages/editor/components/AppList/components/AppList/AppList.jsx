import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';

import AppCard from '../AppCard';
import AppIcon from '../AppIcon';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';
import messages from './messages';

export default class AppList extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    getApps: PropTypes.func.isRequired,
    getPublicApps: PropTypes.func.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = { filter: '' };

  async componentDidMount() {
    const { getApps, getPublicApps, isLoggedIn } = this.props;

    if (isLoggedIn) {
      getApps();
    } else {
      getPublicApps();
    }
  }

  onFilterChange = event => {
    this.setState({ filter: event.target.value });
  };

  render() {
    const { apps, isLoggedIn, intl } = this.props;
    const { filter } = this.state;

    if (!apps) {
      return <Loader />;
    }

    const filteredApps = apps.filter(app => app.name.includes(filter));

    const Component = isLoggedIn ? AppCard : AppIcon;
    const style = isLoggedIn ? styles.appList : styles.appIcons;

    return (
      <React.Fragment>
        <div className={`field ${styles.filter}`}>
          <p className="control has-icons-left">
            <input
              className="input"
              onChange={this.onFilterChange}
              placeholder={intl.formatMessage(messages.search)}
              value={filter}
            />
            <span className="icon is-small is-left">
              <i className="fas fa-search" />
            </span>
          </p>
        </div>
        <div className={style}>
          {filteredApps.map(app => (
            <Component key={app.id} app={app} />
          ))}
          {isLoggedIn && <CreateAppCard />}
        </div>
      </React.Fragment>
    );
  }
}
