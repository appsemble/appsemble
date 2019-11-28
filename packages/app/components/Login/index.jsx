import { connect } from 'react-redux';

import Login from './Login';

function mapStateToProps(state) {
  return {
    definition: state.app.definition,
  };
}

export default connect(mapStateToProps)(Login);
