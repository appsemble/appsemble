import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import CMSRoot from './CMSRoot';

function mapStateToProps(state, ownProps) {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps)(CMSRoot));
