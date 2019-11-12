import { connect } from 'react-redux';

import AnonymousRoute from './AnonymousRoute';

function mapStateToProps(state) {
  return { user: state.user.user };
}

export default connect(mapStateToProps)(AnonymousRoute);
