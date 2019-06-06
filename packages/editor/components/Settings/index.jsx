import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Settings from './Settings';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default withRouter(connect(mapStateToProps)(Settings));
