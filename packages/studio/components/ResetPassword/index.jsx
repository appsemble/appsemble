import { connect } from 'react-redux';

import { requestResetPassword } from '../../actions/user';
import ResetPassword from './ResetPassword';

export default connect(null, { requestResetPassword })(ResetPassword);
