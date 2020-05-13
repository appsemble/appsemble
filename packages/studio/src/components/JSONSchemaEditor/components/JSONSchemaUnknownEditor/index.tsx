import { TextArea } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';
import messages from './messages';

export default function JSONSchemaUnknownEditor({
  name,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<any>): React.ReactElement {
  return (
    <TextArea
      disabled
      help={<FormattedMessage {...messages.help} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={null}
      readOnly
      required={required}
      value={JSON.stringify(value, undefined, 2)}
    />
  );
}
