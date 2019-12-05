import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { getApp } from '../../actions/apps';
import AppContext from './AppContext';

function mapStateToProps(state) {
  return {
    ready: !!state.apps.apps.length,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getApp,
  })(AppContext),
);
