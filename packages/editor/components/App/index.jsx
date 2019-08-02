import { connect } from 'react-redux';

import { initAuth, logout } from '../../actions/user';
import App from './App';

export default connect(
  state => ({
    initialized: state.user.initialized,
  }),
  { logout, initAuth },
)(App);
