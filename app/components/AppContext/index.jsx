import {
  connect,
} from 'react-redux';
import {
  withRouter,
} from 'react-router-dom';

import {
  getApp,
} from '../../actions/app';
import AppContext from './AppContext';


export default withRouter(connect(null, {
  getApp,
})(AppContext));
