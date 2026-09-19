// @vitest-environment jsdom

import { EventEmitter } from 'node:events';

import { createEvents, getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BootstrapParams } from '@appsemble/sdk';
import { expect, it, vi } from 'vitest';

import { type Field, type Values } from '../block.js';

const sdk = vi.hoisted(() => ({
  bootstrap: vi.fn(),
}));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => Promise<void>;

function getInputByLabel(container: HTMLElement, label: string): HTMLInputElement {
  const labelElement = Array.from(container.querySelectorAll('label')).find((element) =>
    element.textContent?.startsWith(label),
  );
  const id = labelElement?.getAttribute('for');

  if (!id) {
    throw new Error(`Could not find input label: ${label}`);
  }

  return container.querySelector(`input[id="${id}"]`) as HTMLInputElement;
}

async function waitFor(assertion: () => void): Promise<void> {
  const end = Date.now() + 1000;

  for (;;) {
    try {
      assertion();
      return;
    } catch (error: unknown) {
      if (Date.now() > end) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
    }
  }
}

it('should wait for pending validation actions before submitting', async () => {
  let resolveValidation!: (value: unknown) => void;
  const validatePostcode = vi.fn(
    () =>
      new Promise((resolve) => {
        resolveValidation = resolve;
      }),
  );
  const onSubmit = vi.fn();
  const container = document.createElement('div');
  const params = {
    ...getDefaultBootstrapParams(),
    actions: {
      onLoad: Object.assign(vi.fn(), { type: 'noop' }),
      onSubmit,
      validatePostcode,
    },
    events: {
      emit: { change: vi.fn() },
      on: {
        data: vi.fn(() => false),
        fields: vi.fn(() => false),
      },
      off: { fields: vi.fn() },
    },
    shadowRoot: container,
    parameters: {
      fields: [
        {
          label: 'Postcode',
          name: 'postcode',
          requirements: [{ required: true }],
          type: 'string',
        },
        {
          label: 'House number',
          name: 'houseNumber',
          requirements: [{ required: true }],
          type: 'string',
        },
      ],
      requirements: [{ action: 'validatePostcode', isValid: ['postcode', 'houseNumber'] }],
      skipInitialLoad: true,
      startDisabled: true,
    },
  } as unknown as BootstrapParams;

  await mount(params);

  const postcode = getInputByLabel(container, 'Postcode');
  const houseNumber = getInputByLabel(container, 'House number');
  const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;

  postcode.value = '6131 LB';
  postcode.dispatchEvent(new InputEvent('input', { bubbles: true }));
  houseNumber.value = '1';
  houseNumber.dispatchEvent(new InputEvent('input', { bubbles: true }));

  await waitFor(() =>
    expect(validatePostcode).toHaveBeenCalledWith({ houseNumber: '1', postcode: '6131 LB' }),
  );
  expect(submit).toHaveProperty('disabled', true);

  const form = submit.closest('form') as HTMLFormElement;

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(onSubmit).not.toHaveBeenCalled();

  resolveValidation({ address: 'Main Street 1, 6131 LB City' });

  await waitFor(() => expect(submit).toHaveProperty('disabled', false));

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      $thumbnails: [],
      address: 'Main Street 1, 6131 LB City',
      houseNumber: '1',
      postcode: '6131 LB',
    }),
  );
});

it('should load the markdown editor when a markdown field is rendered', async () => {
  const container = document.createElement('div');
  const params = {
    ...getDefaultBootstrapParams(),
    actions: {
      onLoad: Object.assign(vi.fn(), { type: 'noop' }),
      onSubmit: vi.fn(),
    },
    events: {
      emit: { change: vi.fn() },
      on: {
        data: vi.fn(() => false),
        fields: vi.fn(() => false),
      },
      off: { fields: vi.fn() },
    },
    shadowRoot: container,
    parameters: {
      fields: [{ label: 'Description', name: 'description', type: 'markdown' }],
      skipInitialLoad: true,
    },
  } as unknown as BootstrapParams;

  await mount(params);

  await waitFor(() =>
    expect(
      Array.from(container.querySelectorAll('button')).find((button) => button.title === 'Bold'),
    ).toBeInstanceOf(HTMLButtonElement),
  );
});

it.each(['data', 'fields'] as const)(
  'should distinguish external %s updates from edits to a local time',
  async (eventName) => {
    const container = document.createElement('div');
    // eslint-disable-next-line unicorn/prefer-event-target
    const emitter = new EventEmitter();
    const changes: { values: Values; lastChanged: string | null }[] = [];
    const submissions: unknown[] = [];
    const fields: Field[] = [
      {
        defaultValue: '07:30',
        format: 'time',
        label: 'Wake time',
        name: 'wakeTime',
        requirements: [{ required: true }],
        type: 'string',
      },
    ];
    emitter.on('changed', (change) => changes.push(change));
    const params = {
      ...getDefaultBootstrapParams(),
      actions: {
        onLoad: Object.assign(() => Promise.resolve(), { type: 'noop' }),
        onSubmit(value: unknown): Promise<void> {
          submissions.push(value);
          return Promise.resolve();
        },
      },
      events: createEvents(
        emitter,
        Promise.resolve(),
        { emit: { change: {} }, listen: { data: {}, fields: {} } },
        { emit: { change: 'changed' }, listen: { [eventName]: 'populate' } },
      ),
      shadowRoot: container,
      parameters: { fields, skipInitialLoad: true },
    } as unknown as BootstrapParams;

    await mount(params);
    const input = getInputByLabel(container, 'Wake time');
    expect(input.value).toBe('07:30');
    input.value = '25:00';
    expect(input.value).toBe('');
    input.value = '06:45';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await waitFor(() =>
      expect(changes.at(-1)).toStrictEqual({
        values: { wakeTime: '06:45' },
        lastChanged: 'wakeTime',
      }),
    );

    emitter.emit(
      'populate',
      eventName === 'data'
        ? { wakeTime: '08:15' }
        : { fields, initialValues: { wakeTime: '08:15' } },
    );
    await waitFor(() => {
      expect(input.value).toBe('08:15');
      expect(changes.at(-1)).toStrictEqual({ values: { wakeTime: '08:15' }, lastChanged: null });
    });

    input.value = '09:30';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await waitFor(() =>
      expect(changes.at(-1)).toStrictEqual({
        values: { wakeTime: '09:30' },
        lastChanged: 'wakeTime',
      }),
    );
    input.form?.requestSubmit();
    await waitFor(() =>
      expect(submissions).toStrictEqual([{ $thumbnails: [], wakeTime: '09:30' }]),
    );
  },
);
