import {
  injectIntl,
} from 'react-intl';
import {
  connect,
} from 'react-redux';

import {
  openMenu,
} from '../../actions/menu';
import SideMenuButton from './SideMenuButton';


export default injectIntl(connect(null, {
  openMenu,
})(SideMenuButton));
