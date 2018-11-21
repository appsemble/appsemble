import { connect } from 'react-redux';

import { resetPassword } from '../../actions/user';
import EditPassword from './EditPassword';

export default connect(
  null,
  { reset: resetPassword },
)(EditPassword);
