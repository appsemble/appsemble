import '../../index.css';

import { connect } from 'react-redux';

import { oauthLogin, passwordLogin } from '../../actions/user';
import Login from './Login';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default connect(mapStateToProps, {
  oauthLogin,
  passwordLogin,
})(Login);
