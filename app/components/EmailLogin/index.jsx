import {
  connect,
} from 'react-redux';

import {
  emailLogin,
} from '../../actions/user';
import EmailLogin from './EmailLogin';


export default connect(null, {
  emailLogin,
})(EmailLogin);
