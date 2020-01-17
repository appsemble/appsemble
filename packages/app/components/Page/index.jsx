import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { getBlockDefs } from '../../actions/blockDefs';
import { logout } from '../../actions/user';
import Page from './Page';

function mapStateToProps(state, ownProps) {
  return {
    definition: state.app.definition,
    user: state.user.user,
    role: state.user.role,
    pending: !!state.blockDefs.pending.length,
    hasErrors:
      ownProps.page.type && (ownProps.page.type === 'flow' || ownProps.page.type === 'tabs')
        ? ownProps.page.subPages.some(sub =>
            sub.blocks.some(block => state.blockDefs.errored.has(block.type)),
          )
        : ownProps.page.blocks.some(block => state.blockDefs.errored.has(block.type)),
  };
}

export default withRouter(
  injectIntl(
    connect(mapStateToProps, {
      getBlockDefs,
      logout,
    })(Page),
  ),
);
