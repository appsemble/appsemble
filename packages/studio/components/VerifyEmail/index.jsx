import { connect } from 'react-redux';

import { verifyEmail } from '../../actions/user';
import VerifyEmail from './VerifyEmail';

export default connect(null, { verifyEmail })(VerifyEmail);
