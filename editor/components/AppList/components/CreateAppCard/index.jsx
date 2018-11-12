import { connect } from 'react-redux';

import { createApp } from '../../../../actions/apps';
import { push } from '../../../../actions/message';
import CreateAppCard from './CreateAppCard';

export default connect(
  state => ({ apps: state.apps.apps, error: state.apps.error }),
  { createApp, push },
)(CreateAppCard);
