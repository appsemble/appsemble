import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import ProfileDropdown from './ProfileDropdown';
import { logout } from '../../actions/user';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    { logout },
  )(ProfileDropdown),
);
