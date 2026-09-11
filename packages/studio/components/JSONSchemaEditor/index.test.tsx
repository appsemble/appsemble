import { fireEvent, render, screen } from '@testing-library/react';
import { type Schema } from 'jsonschema';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

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
    const onFieldChange = vi.fn();
    render(
      <IntlProvider locale="en" messages={{}}>
        <MemoryRouter>
          <JSONSchemaEditor
            errors={[
              { message: 'Upload valid file content.', path: ['attachment'] },
              { message: 'Enter a name.', path: ['profile', 'name'] },
              { message: 'Must be at least 1.', path: ['scores', 0] },
              { message: 'Fix this resource.', path: [] },
            ]}
            name="resource"
            onChange={vi.fn()}
            onFieldChange={onFieldChange}
            schema={schema}
            value={{
              active: false,
              attachment: new File(['invalid'], 'invalid.pdf'),
              count: 0,
              profile: { name: '' },
              scores: [0],
            }}
          />
        </MemoryRouter>
      </IntlProvider>,
    );

    expect(screen.getByText('Enter a name.')).toBeDefined();
    expect(screen.getByText('Must be at least 1.')).toBeDefined();
    expect(screen.getByText('Upload valid file content.')).toBeDefined();
    expect(screen.getByText('Fix this resource.')).toBeDefined();
    expect(
      screen.getByRole('checkbox', { name: 'active active' }).classList.contains('is-danger'),
    ).toBe(false);
    expect(
      screen.getByRole('spinbutton', { name: 'count (Optional)' }).classList.contains('is-danger'),
    ).toBe(false);

    fireEvent.change(screen.getByRole('textbox', { name: 'profile.name (Optional)' }), {
      target: { value: 'Alice' },
    });
    expect(onFieldChange).toHaveBeenLastCalledWith(['profile', 'name']);
  });
});
