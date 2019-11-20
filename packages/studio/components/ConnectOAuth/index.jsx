import '../../index.css';

import { connect } from 'react-redux';

import { oauthLogin } from '../../actions/user';
import ConnectOAuth from './ConnectOAuth';

export default connect(null, { oauthLogin })(ConnectOAuth);
