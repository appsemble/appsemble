import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { push } from '../../actions/message';
import Roles, { RolesProps } from './Roles';

function mapStateToProps(state: State, ownProps: RolesProps): Partial<RolesProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { push })(Roles));
