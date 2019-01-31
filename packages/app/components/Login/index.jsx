import { connect } from 'react-redux';

import Login from './Login';

function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}

export default connect(mapStateToProps)(Login);
