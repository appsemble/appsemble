// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { afterEach, expect, it } from 'vitest';

import { StringInput } from '../StringInput/index.js';

const blockProps = {
  ...getDefaultBootstrapParams(),
  actions: {
    onLoad: Object.assign((data: unknown) => Promise.resolve(data), { type: 'noop' }),
    onPrevious: Object.assign((data: unknown) => Promise.resolve(data), { type: 'noop' }),
    onSubmit: Object.assign((data: unknown) => Promise.resolve(data), { type: 'noop' }),
  },
  parameters: { fields: [] },
} as BlockProps;

function TimeForm({
  cycle,
  initial = '23:05',
  readOnly = false,
  disabled = false,
}: {
  readonly cycle?: 'h12' | 'h23';
  readonly initial?: string;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
}): VNode {
  const [values, setValues] = useState({ time: initial, cycle });
  const [saved, setSaved] = useState('Not saved');
  return (
    <Context.Provider value={blockProps}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(values.time);
        }}
      >
        <StringInput
          disabled={disabled}
          error={null}
          field={{
            format: 'time',
            hourCycle: cycle ? { prop: 'cycle' } : undefined,
            label: 'Wake time',
            name: 'time',
            requirements: [{ required: true }],
            type: 'string',
          }}
          formValues={values}
          name="time"
          onChange={(name, value) => setValues((current) => ({ ...current, time: value! }))}
          readOnly={readOnly}
        />
        <button
          onClick={() =>
            setValues((current) => ({
              ...current,
              cycle: current.cycle === 'h23' ? 'h12' : 'h23',
            }))
          }
          type="button"
        >
          Change hour cycle
        </button>
        <button type="submit">Save</button>
        <output aria-label="Saved time">{saved}</output>
      </form>
    </Context.Provider>
  );
}

afterEach(cleanup);

it.each([
  ['h12', '11:05 PM', '11', '1', '12'],
  ['h23', '23:05', '23', '0', '23'],
] as const)('should display and edit time using %s', async (cycle, display, hour, min, max) => {
  const user = userEvent.setup();
  render(<TimeForm cycle={cycle} />);
  const input = screen.getByRole('textbox', { name: 'Wake time' });
  await waitFor(() => expect(input).toHaveProperty('value', display));

  await user.click(input);
  const hours = screen.getByRole('spinbutton', { name: 'Hour' });
  expect(hours).toHaveProperty('value', hour);
  expect(hours).toHaveProperty('min', min);
  expect(hours).toHaveProperty('max', max);
  await user.clear(screen.getByRole('spinbutton', { name: 'Minute' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Minute' }), '42');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByLabelText('Saved time').textContent).toBe('23:42');
});

it.each([
  ['00:07', '12:07 AM', '12:00 AM', '00:00'],
  ['12:07', '12:07 PM', '12:00 PM', '12:00'],
  ['19:07', '7:07 PM', '08:15 AM', '08:15'],
])(
  'should preserve wall time when editing %s in a 12-hour field',
  async (initial, display, edit, saved) => {
    const user = userEvent.setup();
    render(<TimeForm cycle="h12" initial={initial} />);
    const input = screen.getByRole('textbox', { name: 'Wake time' });
    await waitFor(() => expect(input).toHaveProperty('value', display));

    await user.clear(input);
    await user.type(input, edit);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByLabelText('Saved time').textContent).toBe(saved);
  },
);

it('should change its displayed cycle without changing the stored time', async () => {
  const user = userEvent.setup();
  render(<TimeForm cycle="h23" initial="19:30" />);
  const input = screen.getByRole('textbox', { name: 'Wake time' });
  await waitFor(() => expect(input).toHaveProperty('value', '19:30'));

  await user.click(screen.getByRole('button', { name: 'Change hour cycle' }));
  await waitFor(() => expect(input).toHaveProperty('value', '7:30 PM'));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByLabelText('Saved time').textContent).toBe('19:30');

  await user.click(screen.getByRole('button', { name: 'Change hour cycle' }));
  await waitFor(() => expect(input).toHaveProperty('value', '19:30'));
});

it.each(['readOnly', 'disabled'] as const)(
  'should display a %s time without permitting edits',
  async (state) => {
    const user = userEvent.setup();
    render(<TimeForm cycle="h12" {...{ [state]: true }} />);
    const input = screen.getByRole('textbox', { name: 'Wake time' });
    await waitFor(() => expect(input).toHaveProperty('value', '11:05 PM'));
    await user.click(input);
    await user.keyboard('10:30 AM');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('spinbutton', { name: 'Hour' })).toBeNull();
    expect(screen.getByLabelText('Saved time').textContent).toBe('23:05');
  },
);

it('should use the native time input when no hour cycle is requested', () => {
  render(<TimeForm />);
  const input = screen.getByLabelText('Wake time');
  expect(input).toHaveProperty('type', 'time');
  expect(input).toHaveProperty('value', '23:05');
  expect(screen.queryByRole('spinbutton', { name: 'Hour' })).toBeNull();
});

it('should apply the chosen AM or PM period before saving', async () => {
  const user = userEvent.setup();
  render(<TimeForm cycle="h12" />);
  const input = screen.getByRole('textbox', { name: 'Wake time' });
  await waitFor(() => expect(input).toHaveProperty('value', '11:05 PM'));
  await user.click(input);
  await user.click(screen.getByText('PM'));
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByLabelText('Saved time').textContent).toBe('11:05');
  expect(input).toHaveProperty('value', '11:05 AM');
});
