import { connect } from 'react-redux';

import { createApp } from '../../../../actions/app';
import { push } from '../../../../../app/actions/message';
import CreateAppCard from './CreateAppCard';

export default connect(
  state => ({ apps: state.apps.apps, error: state.apps.error }),
  { createApp, push },
)(CreateAppCard);
