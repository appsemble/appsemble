import { connect } from 'react-redux';

import { initAuth, logout } from '../../actions/user';
import App from './App';

export default connect(
  state => ({
    user: state.user,
  }),
  { logout, initAuth },
)(App);
