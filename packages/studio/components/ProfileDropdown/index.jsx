import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { logout } from '../../actions/user';
import ProfileDropdown from './ProfileDropdown';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { logout })(ProfileDropdown));
