import { connect } from 'react-redux';

import { registerEmail } from '../../actions/user';
import Register from './Register';

export default connect(
  null,
  { register: registerEmail },
)(Register);
