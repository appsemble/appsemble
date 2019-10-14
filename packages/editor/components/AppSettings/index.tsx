import { App } from '@appsemble/types';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import AppSettings, { AppSettingsProps } from './AppSettings';

function mapStateToProps(
  state: { apps: { apps: App[] } },
  ownProps: AppSettingsProps,
): Partial<AppSettingsProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps)(AppSettings));
