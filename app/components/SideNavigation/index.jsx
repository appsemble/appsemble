import {
  connect,
} from 'react-redux';

import SideNavigation from './SideNavigation';


function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}


export default connect(mapStateToProps)(SideNavigation);
