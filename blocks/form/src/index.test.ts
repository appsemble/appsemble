// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BootstrapParams } from '@appsemble/sdk';
import { noop } from '@appsemble/utils';
import { within } from '@testing-library/dom';
import { render } from 'preact';
import { afterEach, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  bootstrap: vi.fn(),
}));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => Promise<void>;
const containers = new Set<HTMLElement>();

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

afterEach(() => {
  for (const container of containers) {
    render(null, container);
  }
  containers.clear();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

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

async function mountInlineSelection(disabled = false): Promise<HTMLElement> {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = noop;

      unobserve = noop;

      disconnect = noop;
    },
  );
  const container = document.createElement('div');
  const output = document.createElement('output');
  containers.add(container);
  output.setAttribute('aria-label', 'Saved selection');
  document.body.append(container);
  const params = getDefaultBootstrapParams();
  await mount({
    ...params,
    shadowRoot: container,
    parameters: {
      fields: [
        {
          name: 'sounds',
          type: 'selection',
          display: 'inline',
          label: 'Sounds',
          disableSearch: true,
          disabled,
          selection: [
            { id: 1, header: 'Rain' },
            { id: 2, header: 'Waves' },
            { id: 3, header: 'Wind' },
          ],
          requirements: [{ maxItems: 2 }],
        },
      ],
    },
    actions: {
      onLoad: Object.assign(noop, { type: 'noop' }),
      onSubmit({ sounds }: { sounds: { id: number }[] }) {
        output.textContent = sounds.map(({ id }) => id).join(', ');
      },
    },
    events: {
      emit: { change: noop },
      on: { data: () => false, fields: () => false },
      off: { data: noop, fields: noop },
    },
  } as unknown as BootstrapParams);
  container.append(output);
  return container;
}

it('selects inline choices in the chosen order and removes them without opening a dialog', async () => {
  const container = await mountInlineSelection();
  const screen = within(container);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Waves' })).toBeDefined());
  screen.getByRole('button', { name: 'Waves' }).click();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Waves', pressed: true })).toBeDefined(),
  );
  screen.getByRole('button', { name: 'Rain' }).click();
  await waitFor(() =>
    expect((screen.getByRole('button', { name: 'Wind' }) as HTMLButtonElement).disabled).toBe(true),
  );
  screen.getByRole('button', { name: 'submitLabel' }).click();
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Saved selection' }).textContent).toBe('2, 1'),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() =>
    expect((screen.getByRole('button', { name: 'Waves' }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
  screen.getByRole('button', { name: 'Waves' }).click();
  await waitFor(() =>
    expect((screen.getByRole('button', { name: 'Wind' }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
  screen.getByRole('button', { name: 'submitLabel' }).click();
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Saved selection' }).textContent).toBe('1'),
  );
});

it('keeps inline choices disabled when the field is disabled', async () => {
  const screen = within(await mountInlineSelection(true));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Rain' })).toBeDefined());
  for (const name of ['Rain', 'Waves', 'Wind']) {
    expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true);
  }
});
