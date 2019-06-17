import '../../index.css';

import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import OrganizationInvite from './OrganizationInvite';

export default injectIntl(
  connect(
    null,
    { push },
  )(OrganizationInvite),
);
