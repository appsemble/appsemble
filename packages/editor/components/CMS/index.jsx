import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import CMS from './CMS';

function mapStateToProps(state, ownProps) {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    user: state.user.user,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    {},
  )(CMS),
);
