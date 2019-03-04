import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { createApp } from '../../../../actions/apps';
import { push } from '../../../../actions/message';
import CreateAppCard from './CreateAppCard';

export default injectIntl(
  connect(
    state => ({ apps: state.apps.apps, error: state.apps.error, user: state.user.user }),
    { createApp, push },
  )(CreateAppCard),
);
