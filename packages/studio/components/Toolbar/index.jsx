import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { logout } from '../../actions/user';
import Toolbar from './Toolbar';

function mapStateToProps(state) {
  return {
    isLoggedIn: !!state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { logout })(Toolbar));
