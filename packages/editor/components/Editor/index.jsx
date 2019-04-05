import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { push } from '../../actions/message';
import { getOpenApiSpec } from '../../actions/openApi';
import Editor from './Editor';

function mapStateToProps(state) {
  return {
    openApiSpec: state.openApi.spec,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    { getOpenApiSpec, push },
  )(Editor),
);
