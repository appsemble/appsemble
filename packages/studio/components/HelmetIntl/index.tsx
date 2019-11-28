import { injectIntl } from 'react-intl';

import HelmetIntl, { HelmIntlProps } from './HelmetIntl';

export default injectIntl<'intl', HelmIntlProps>(HelmetIntl);
