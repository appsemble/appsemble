import { withBlock } from '@appsemble/preact';

import { FileField, RendererProps } from '../../../../block';
import FileRenderer from './FileRenderer';

export default withBlock<RendererProps<FileField>>(FileRenderer);
