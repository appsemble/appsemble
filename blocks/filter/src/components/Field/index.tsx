import { injectIntl } from 'react-intl';

import Field, { FieldProps } from './Field';

export default injectIntl<'intl', FieldProps>(Field);
