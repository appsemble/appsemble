import { App } from '@appsemble/types';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import AppDetails, { AppDetailsProps } from './AppDetails';

function mapStateToProps(
  state: { apps: { apps: App[] } },
  ownProps: AppDetailsProps,
): Partial<AppDetailsProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps)(AppDetails));
