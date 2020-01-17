import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { State } from '../../actions';
import Roles, { RolesProps } from './Roles';

function mapStateToProps(state: State, ownProps: RolesProps): Partial<RolesProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps)(Roles));
