import {
  connect,
} from 'react-redux';

import {
  getBlockDefs,
} from '../../actions/blockDefs';
import SplashAction from './SplashAction';


function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}


export default connect(mapStateToProps, {
  getBlockDefs,
})(SplashAction);
