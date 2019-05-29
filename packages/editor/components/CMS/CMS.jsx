import PropTypes from 'prop-types';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import CMSRoot from '../CMSRoot';
import ResourceTable from '../ResourceTable';

export default class CMS extends React.Component {
  static propTypes = {
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { match } = this.props;

    return (
      <Switch>
        <Route component={CMSRoot} exact path={match.path} />
        <Route component={ResourceTable} path={`${match.path}/:resourceName/:mode?/:resourceId?`} />
        <Redirect to={match.path} />
      </Switch>
    );
  }
}
