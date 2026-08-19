import { render, screen } from '@testing-library/react';
import { type Schema } from 'jsonschema';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { JSONSchemaEditor } from './index.js';

const schema: Schema = {
  properties: {
    active: { type: 'boolean' },
    attachment: { format: 'binary', type: 'string' },
    count: { type: 'number' },
    profile: {
      properties: {
        name: { type: 'string' },
      },
      type: 'object',
    },
    scores: {
      items: { type: 'number' },
      type: 'array',
    },
  },
  type: 'object',
};

describe('JSONSchemaEditor', () => {
  it('shows validation messages at their fields without marking valid falsy values', () => {
    render(
      <IntlProvider locale="en" messages={{}}>
        <JSONSchemaEditor
          errors={[
            { message: 'Upload valid file content.', path: ['attachment'] },
            { message: 'Enter a name.', path: ['profile', 'name'] },
            { message: 'Must be at least 1.', path: ['scores', 0] },
            { message: 'Fix this resource.', path: [] },
          ]}
          name="resource"
          onChange={vi.fn()}
          schema={schema}
          value={{
            active: false,
            attachment: new File(['invalid'], 'invalid.pdf'),
            count: 0,
            profile: { name: '' },
            scores: [0],
          }}
        />
      </IntlProvider>,
    );

    expect(screen.getByText('Enter a name.')).toBeDefined();
    expect(screen.getByText('Must be at least 1.')).toBeDefined();
    expect(screen.getByText('Upload valid file content.')).toBeDefined();
    expect(screen.getByText('Fix this resource.')).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'active' })).not.toHaveClass('is-danger');
    expect(screen.getByRole('spinbutton', { name: 'count' })).not.toHaveClass('is-danger');
  });
});
