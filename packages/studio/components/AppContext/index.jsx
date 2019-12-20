import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { getApp } from '../../actions/apps';
import AppContext from './AppContext';

function mapStateToProps(state, ownProps) {
  return {
    app:
      state.apps.apps.length &&
      state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    ready: !!state.apps.apps.length,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getApp,
  })(AppContext),
);
