import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import ResourceTable from '../ResourceTable';
import SideMenu from '../SideMenu';

export default class CMS extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;
    console.log('cms', match);

    return (
      <React.Fragment>
        <Route
          path={`${match.path}/:resourceName?`}
          render={props => <SideMenu app={app} {...props} />}
        />
        <Switch>
          <Route
            exact
            path={match.path}
            render={() => (
              <p>
                this app has the following resources:
                {Object.keys(app.resources).join(', ')}
              </p>
            )}
          />

          <Route component={ResourceTable} exact path={`${match.path}/:resourceName`} />
        </Switch>
      </React.Fragment>
    );
  }
}
