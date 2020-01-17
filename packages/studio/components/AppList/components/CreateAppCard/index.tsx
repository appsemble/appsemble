import { connect } from 'react-redux';

import { createTemplateApp } from '../../../../actions/apps';
import CreateAppCard from './CreateAppCard';

export default connect(null, {
  createTemplateApp,
})(CreateAppCard);
