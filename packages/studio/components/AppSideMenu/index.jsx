import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import AppSideMenu from './AppSideMenu';

function mapStateToProps(state, ownProps) {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default withRouter(connect(mapStateToProps)(AppSideMenu));
