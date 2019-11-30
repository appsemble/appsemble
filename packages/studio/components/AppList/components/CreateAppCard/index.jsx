import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { createTemplateApp } from '../../../../actions/apps';
import { push } from '../../../../actions/message';
import CreateAppCard from './CreateAppCard';

export default withRouter(
  injectIntl(
    connect(state => ({ apps: state.apps.apps, error: state.apps.error, user: state.user.user }), {
      createTemplateApp,
      push,
    })(CreateAppCard),
  ),
);
