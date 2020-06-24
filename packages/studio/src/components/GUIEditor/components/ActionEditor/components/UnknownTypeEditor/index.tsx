import { JSONInput } from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import messages from './messages';

interface UnknownTypeEditorProps {
  value: any;
  name: string;
  onChange: (event: NamedEvent, value?: any) => void;
  required: boolean;
}

export default function UnknownTypeEditor({
  name,
  onChange,
  required,
  value = '',
}: UnknownTypeEditorProps): React.ReactElement {
  return (
    <JSONInput
      help={<FormattedMessage {...messages.help} />}
      label={name}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    />
  );
}
