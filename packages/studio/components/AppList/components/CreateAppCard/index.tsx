import { connect } from 'react-redux';

import { createTemplateApp } from '../../../../actions/apps';
import { push } from '../../../../actions/message';
import CreateAppCard from './CreateAppCard';

export default connect(null, {
  createTemplateApp,
  push,
})(CreateAppCard);
