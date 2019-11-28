import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';

import AppCard from './AppCard';

export default withRouter(injectIntl(AppCard));
