import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { push } from '../../actions/message';
import { passwordLogin, registerEmail } from '../../actions/user';
import Register from './Register';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default withRouter(
  injectIntl(connect(mapStateToProps, { registerEmail, passwordLogin, push })(Register)),
);
