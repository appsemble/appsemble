import { EmailLogin } from '@appsemble/react-components';
import { connect } from 'react-redux';

import { passwordLogin } from '../../actions/user';

export default connect(null, {
  passwordLogin,
})(EmailLogin);
