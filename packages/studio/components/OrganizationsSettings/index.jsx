import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import { updateUser } from '../../actions/user';
import OrganizationsSettings from './OrganizationsSettings';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { push, updateUser })(OrganizationsSettings));
