import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import OrganizationsSettings from './OrganizationsSettings';

export default injectIntl(connect(null, { push })(OrganizationsSettings));
