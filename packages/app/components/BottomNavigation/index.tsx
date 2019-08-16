import { connect } from 'react-redux';

import BottomNavigation, { BottomNavigationProps } from './BottomNavigation';

// XXX fix state type
function mapStateToProps(state: any): Pick<BottomNavigationProps, 'app'> {
  return {
    app: state.app.app,
  };
}

export default connect(mapStateToProps)(BottomNavigation);
