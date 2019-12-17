import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { logout } from '../../actions/user';
import ProfileDropdown, { ProfileDropDownProps } from './ProfileDropdown';

function mapStateToProps(state: State): Partial<ProfileDropDownProps> {
  return {
    definition: state.app.definition,
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { logout })(ProfileDropdown));
