import { connect } from 'react-redux';

import { State } from '../../actions';
import OrganizationProvider, { OrganizationProviderProps } from './OrganizationProvider';

function mapStateToProps(state: State): Partial<OrganizationProviderProps> {
  return {
    user: state.user.user,
  };
}

export default connect(mapStateToProps)(OrganizationProvider);
