import {
  connect,
} from 'react-redux';

import {
  openMenu,
} from '../../actions/menu';
import SideMenuButton from './SideMenuButton';


export default connect(null, {
  openMenu,
})(SideMenuButton);
