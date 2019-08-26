import { connect } from 'react-redux';

import BottomNavigation from './BottomNavigation';

// XXX fix state type
function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}

export default connect(mapStateToProps)(BottomNavigation);
