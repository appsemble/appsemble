import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { push } from '../../actions/message';
import AppDetails, { AppDetailsProps } from './AppDetails';

function mapStateToProps(state: State, ownProps: AppDetailsProps): Partial<AppDetailsProps> {
  return {
    user: state.user.user,
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps, { push })(AppDetails));
