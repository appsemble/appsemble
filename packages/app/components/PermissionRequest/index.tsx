import { connect } from 'react-redux';

import { State } from '../../actions';
import { requestPermission, subscribe } from '../../actions/serviceWorker';
import PermissionRequest from './PermissionRequest';

function mapStateToProps(
  state: State,
): Partial<React.ComponentPropsWithoutRef<typeof PermissionRequest>> {
  return { definition: state.app.definition, permission: state.serviceWorker.permission };
}

export default connect(mapStateToProps, { subscribe, requestPermission })(PermissionRequest);
