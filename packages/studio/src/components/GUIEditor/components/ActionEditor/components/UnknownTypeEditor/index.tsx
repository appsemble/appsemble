import { TextArea } from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface UnknownTypeEditorProps {
  value: any;
  name: string;
}

export default function UnknownTypeEditor({
  name,
  value = '',
}: UnknownTypeEditorProps): React.ReactElement {
  return (
    <TextArea
      disabled
      help={<FormattedMessage {...messages.help} />}
      label={name}
      name={name}
      onChange={null}
      readOnly
      value={JSON.stringify(value, undefined, 2)}
    />
  );
}
