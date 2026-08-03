// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BootstrapParams } from '@appsemble/sdk';
import { expect, it, vi } from 'vitest';

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
