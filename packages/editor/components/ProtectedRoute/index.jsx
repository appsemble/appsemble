import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';

function mapStateToProps(state) {
  return { user: state.user.user };
}

export default withRouter(connect(mapStateToProps)(ProtectedRoute));
