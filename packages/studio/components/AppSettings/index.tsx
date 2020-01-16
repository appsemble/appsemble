import { App } from '@appsemble/types';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { updateApp } from '../../actions/apps';
import AppSettings from './AppSettings';

function mapStateToProps(
  state: { apps: { apps: App[] } },
  ownProps: React.ComponentPropsWithoutRef<typeof AppSettings>,
): Partial<React.ComponentPropsWithoutRef<typeof AppSettings>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps, { updateApp })(AppSettings));
