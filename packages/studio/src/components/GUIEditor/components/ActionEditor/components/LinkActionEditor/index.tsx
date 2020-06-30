import { Select } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import messages from './messages';

interface LinkActionEditorProps {
  app: App;
  value: any;
  onChange: (event: NamedEvent, value?: any) => void;
}

export default function LinkActionEditor({
  app,
  onChange,
  value = {},
}: LinkActionEditorProps): React.ReactElement {
  const handleChange = React.useCallback(
    (event: NamedEvent, val) => {
      onChange(event, { ...value, [event.target.name]: val });
    },
    [onChange, value],
  );

  return (
    <div>
      <Select
        help={<FormattedMessage {...messages.toHelp} />}
        label={<FormattedMessage {...messages.toLabel} />}
        name="to"
        onChange={handleChange}
        required
        value={value.to}
      >
        <option disabled hidden>
          <FormattedMessage {...messages.empty} />
        </option>
        {Object.values(app.definition.pages).map((page) => (
          <option key={page.name} value={page.name}>
            {page.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
