import { connect } from 'react-redux';

import { State } from '../../actions';
import { requestPermission, subscribe } from '../../actions/serviceWorker';
import PermissionRequest, { PermissionRequestProps } from './PermissionRequest';

function mapStateToProps(state: State): Partial<PermissionRequestProps> {
  return { definition: state.app.definition, permission: state.serviceWorker.permission };
}

export default connect(mapStateToProps, { subscribe, requestPermission })(PermissionRequest);
