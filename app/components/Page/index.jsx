import {
  connect,
} from 'react-redux';

import {
  getBlockDefs,
} from '../../actions/blockDefs';
import Page from './Page';


function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}


export default connect(mapStateToProps, {
  getBlockDefs,
})(Page);
