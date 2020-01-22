import { connect } from 'react-redux';

import { State } from '../../actions';
import PermissionRequest from './PermissionRequest';

function mapStateToProps(
  state: State,
): Partial<React.ComponentPropsWithoutRef<typeof PermissionRequest>> {
  return { definition: state.app.definition };
}

export default connect(mapStateToProps)(PermissionRequest);
