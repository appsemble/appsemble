import {
  connect,
} from 'react-redux';

import {
  getApp,
} from '../../actions/app';
import AppContext from './AppContext';


export default connect(null, {
  getApp,
})(AppContext);
