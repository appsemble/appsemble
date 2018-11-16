import { connect } from 'react-redux';

import { logout, initAuth } from '../../actions/user';
import App from './App';

export default connect(
  state => ({
    user: state.user,
  }),
  { logout, initAuth },
)(App);
