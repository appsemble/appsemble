import { connect } from 'react-redux';

import { EmailLogin } from '@appsemble/react-components';
import { passwordLogin } from '../../actions/user';

export default connect(
  null,
  {
    passwordLogin,
  },
)(EmailLogin);
