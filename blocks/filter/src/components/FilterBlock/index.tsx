import { injectIntl } from 'react-intl';

import FilterBlock, { FilterBlockProps } from './FilterBlock';

export default injectIntl<'intl', FilterBlockProps>(FilterBlock);
