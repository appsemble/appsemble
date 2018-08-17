import {
  connect,
} from 'react-redux';

import {
  getBlockDefs,
} from '../../actions/blockDefs';
import Page from './Page';


export default connect(null, {
  getBlockDefs,
})(Page);
