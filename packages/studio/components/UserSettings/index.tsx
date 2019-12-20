import { connect } from 'react-redux';

import { push } from '../../actions/message';
import UserSettings from './UserSettings';

export default connect(null, { push })(UserSettings);
