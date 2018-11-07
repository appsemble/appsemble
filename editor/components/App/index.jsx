import { connect } from 'react-redux';

import { logout, initAuth } from '../../../app/actions/user';
import App from './App';

export default connect(
  state => ({
    user: state.user,
  }),
  { logout, initAuth },
)(App);
