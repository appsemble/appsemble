import { connect } from 'react-redux';

import UserSettings from './UserSettings';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default connect(mapStateToProps)(UserSettings);
