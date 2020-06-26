import { Select } from '@appsemble/react-components/src';
import type { App } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import messages from './messages';

interface PageSelectProps {
  app: App;
  name: string;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
  required: boolean;
}

export default function PageSelect({
  app,
  name,
  onChange,
  required,
  value = null,
}: PageSelectProps): React.ReactElement {
  const pages = Object.values(app.definition.pages);

  return (
    <Select label={name} name={name} onChange={onChange} required={required} value={value}>
      <option disabled hidden>
        <FormattedMessage {...messages.empty} />
      </option>
      {pages.map((option) => (
        <option key={option.name} value={option.name}>
          {option.name}
        </option>
      ))}
    </Select>
  );
}
