import { connect } from 'react-redux';
import '../../index.css';

import { oauthLogin, passwordLogin } from '../../actions/user';
import Login from './Login';

export default connect(
  null,
  {
    oauthLogin,
    passwordLogin,
  },
)(Login);
