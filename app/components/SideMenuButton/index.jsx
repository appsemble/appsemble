import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { openMenu } from '../../actions/menu';
import SideMenuButton from './SideMenuButton';

function mapStateToProps(state) {
  return {
    isOpen: state.menu.isOpen,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    { openMenu },
  )(SideMenuButton),
);
