import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { push } from '../../actions/message';
import { getOpenApiSpec } from '../../actions/openApi';
import Editor from './Editor';

function mapStateToProps(state, ownProps) {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    openApiSpec: state.openApi.spec,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    { getOpenApiSpec, push },
  )(Editor),
);
