import { connect } from 'react-redux';

import { push } from '../../actions/message';
import OrganizationsSettings from './OrganizationsSettings';

export default connect(null, { push })(OrganizationsSettings);
