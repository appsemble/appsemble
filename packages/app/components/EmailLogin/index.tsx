import { connect } from 'react-redux';

import { passwordLogin } from '../../actions/user';
import EmailLogin from './EmailLogin';

export default connect(null, {
  passwordLogin,
})(EmailLogin);
