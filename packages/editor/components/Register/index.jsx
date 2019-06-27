import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import { registerEmail } from '../../actions/user';
import Register from './Register';

export default injectIntl(
  connect(
    null,
    { registerEmail, push },
  )(Register),
);
