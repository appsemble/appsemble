// @vitest-environment jsdom

import { EventEmitter } from 'node:events';

import { createEvents, getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BootstrapParams } from '@appsemble/sdk';
import { within } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { expect, it, onTestFinished, vi } from 'vitest';

import { type Field, type Values } from '../block.js';
import messages from '../i18n/en.json' with { type: 'json' };

const sdk = vi.hoisted(() => ({
  bootstrap: vi.fn(),
}));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

// Jsdom doesn’t implement scrolling.
Element.prototype.scrollIntoView = () => null;

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
  // The markdown editor is loaded lazily, which can take a while on a loaded CI runner.
  const end = Date.now() + 10_000;

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

it('should submit the markdown typed right before the submit', async () => {
  const onSubmit = vi.fn();
  const container = document.createElement('div');
  const params = {
    ...getDefaultBootstrapParams(),
    actions: {
      onLoad: Object.assign(vi.fn(), { type: 'noop' }),
      onSubmit,
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
          label: 'Description',
          name: 'description',
          requirements: [{ required: true }],
          type: 'markdown',
        },
      ],
      skipInitialLoad: true,
    },
  } as unknown as BootstrapParams;

  await mount(params);

  await waitFor(() =>
    expect(container.querySelector('.ProseMirror p')).toBeInstanceOf(HTMLParagraphElement),
  );
  const paragraph = container.querySelector('.ProseMirror p') as HTMLParagraphElement;

  // Type the way a browser does: change the editable DOM, which the editor observes.
  paragraph.textContent = 'A new product is available.';
  // One event loop turn: the editor reports the change and the form re-renders in that time.
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  const form = container.querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      $thumbnails: [],
      description: expect.stringMatching(/^A new product is available\.\s*$/),
    }),
  );
});

it('should hide the error summary when hideErrorSummary is set', async () => {
  async function submitInvalidForm(parameters: Record<string, unknown>): Promise<HTMLElement> {
    const container = document.createElement('div');
    const defaultParams = getDefaultBootstrapParams();
    await mount({
      ...defaultParams,
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
        fields: [
          {
            label: 'Registration number',
            name: 'registrationNumber',
            requirements: [
              { regex: '^\\d{9}$', errorMessage: 'This registration number is not valid' },
            ],
            type: 'string',
          },
        ],
        skipInitialLoad: true,
        ...parameters,
      },
      utils: {
        ...defaultParams.utils,
        formatMessage: (message: keyof typeof messages) => messages[message],
      },
    } as unknown as BootstrapParams);

    const input = getInputByLabel(container, 'Registration number');
    input.value = '123';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await waitFor(() =>
      expect(container.textContent).toContain('This registration number is not valid'),
    );
    input.form?.requestSubmit();

    const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;
    await waitFor(() => expect(submit).toHaveProperty('disabled', true));
    return container;
  }

  const withSummary = await submitInvalidForm({});
  expect(withSummary.textContent).toContain('Please fix the following errors:');

  const withNonMatchingRemapper = await submitInvalidForm({
    hideErrorSummary: { equals: [{ prop: 'registrationNumber' }, '456'] },
  });
  expect(withNonMatchingRemapper.textContent).toContain('Please fix the following errors:');

  const withoutSummary = await submitInvalidForm({
    hideErrorSummary: { equals: [{ prop: 'registrationNumber' }, '123'] },
  });
  expect(withoutSummary.textContent).not.toContain('Please fix the following errors:');
  expect(withoutSummary.textContent).toContain('This registration number is not valid');
});

it('should show the errors of untouched fields after submitting', async () => {
  const container = document.createElement('div');
  const defaultParams = getDefaultBootstrapParams();
  await mount({
    ...defaultParams,
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
      fields: [
        {
          label: 'Name',
          name: 'name',
          requirements: [{ required: true, errorMessage: 'Name is required' }],
          type: 'string',
        },
        {
          fields: [
            {
              label: 'City',
              name: 'city',
              requirements: [{ required: true, errorMessage: 'City is required' }],
              type: 'string',
            },
          ],
          label: 'Address',
          name: 'address',
          type: 'fieldset',
        },
      ],
      hideErrorSummary: true,
      skipInitialLoad: true,
    },
    utils: {
      ...defaultParams.utils,
      formatMessage: (message: keyof typeof messages) => messages[message],
    },
  } as unknown as BootstrapParams);

  const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;
  await waitFor(() => expect(submit).toHaveProperty('disabled', false));
  expect(container.textContent).not.toContain('Name is required');

  submit.form?.requestSubmit();

  await waitFor(() => {
    expect(container.textContent).toContain('Name is required');
    expect(container.textContent).toContain('City is required');
  });
  expect(container.textContent).not.toContain('Please fix the following errors:');
});

it('should name the invalid fields in the alert after a failed submit', async () => {
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
      fields: [
        {
          label: 'Name',
          name: 'name',
          requirements: [{ required: true, errorMessage: 'Name is required' }],
          type: 'string',
        },
      ],
      skipInitialLoad: true,
    },
  } as unknown as BootstrapParams;

  await mount(params);

  const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;
  await waitFor(() => expect(submit).toHaveProperty('disabled', false));
  submit.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  await waitFor(() =>
    expect(
      Array.from(container.querySelectorAll('[role="alert"]'), (alert) => alert.textContent),
    ).toContainEqual(expect.stringContaining('Name: Name is required')),
  );
});

it.each([
  { loaded: { name: 'Ada' }, shown: 'Ada' },
  { loaded: undefined, shown: '' },
])(
  'should disable the fields until the onLoad action resolves with $loaded',
  async ({ loaded, shown }) => {
    let resolveLoad!: (value: unknown) => void;
    const container = document.createElement('div');
    await mount({
      ...getDefaultBootstrapParams(),
      actions: {
        onLoad: Object.assign(
          () =>
            new Promise((resolve) => {
              resolveLoad = resolve;
            }),
          { type: 'resource.get' },
        ),
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
        fields: [{ label: 'Name', name: 'name', type: 'string' }],
      },
    } as unknown as BootstrapParams);

    const input = getInputByLabel(container, 'Name');
    expect(input).toHaveProperty('disabled', true);

    resolveLoad(loaded);

    await waitFor(() => expect(input).toHaveProperty('disabled', false));
    expect(input.value).toBe(shown);
  },
);

it('should keep the date picker open when another field changes', async () => {
  // The date picker names weekdays and months in the document language.
  document.documentElement.lang = 'en';
  const change = vi.fn();
  const container = document.createElement('div');
  await mount({
    ...getDefaultBootstrapParams(),
    actions: {
      onLoad: Object.assign(vi.fn(), { type: 'noop' }),
      onSubmit: vi.fn(),
    },
    events: {
      emit: { change },
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
          label: 'Date',
          name: 'date',
          requirements: [{ saturday: false, sunday: false }],
          type: 'date',
        },
        { label: 'Name', name: 'name', type: 'string' },
      ],
      skipInitialLoad: true,
    },
  } as unknown as BootstrapParams);

  getInputByLabel(container, 'Date').click();
  await waitFor(() =>
    expect(container.querySelector('.flatpickr-calendar.open')).toBeInstanceOf(HTMLElement),
  );

  const name = getInputByLabel(container, 'Name');
  name.value = 'Ada';
  name.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ lastChanged: 'name' })),
  );

  expect(container.querySelector('.flatpickr-calendar.open')).toBeInstanceOf(HTMLElement);
});

const fieldsWithHelp = [
  {
    help: 'Your full name',
    label: 'Name',
    name: 'name',
    requirements: [{ required: true, errorMessage: 'Name is required' }],
    type: 'string',
  },
  {
    help: 'Your favorite color',
    label: 'Color',
    name: 'color',
    options: [{ label: 'Red', value: 'red' }],
    requirements: [{ required: true, errorMessage: 'Color is required' }],
    type: 'radio',
  },
  {
    label: 'Products',
    name: 'products',
    requirements: [{ minItems: 1, errorMessage: 'Pick a product' }],
    selection: [{ id: 1, header: 'Apple' }],
    type: 'selection',
  },
];

async function mountForm(parameters: Record<string, unknown>): Promise<HTMLElement> {
  const container = document.createElement('div');
  // Focus only moves to elements that are attached to the document.
  document.body.append(container);
  onTestFinished(() => container.remove());
  const defaultParams = getDefaultBootstrapParams();
  await mount({
    ...defaultParams,
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
    parameters: { skipInitialLoad: true, ...parameters },
    utils: {
      ...defaultParams.utils,
      formatMessage: (message: keyof typeof messages) => messages[message],
    },
  } as unknown as BootstrapParams);
  return container;
}

async function submitForm(container: HTMLElement): Promise<void> {
  const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;
  await waitFor(() => expect(submit).toHaveProperty('disabled', false));
  submit.form!.requestSubmit();
}

/**
 * Name the given elements in the order they appear in the document.
 *
 * @param elements The elements to order by their names.
 * @returns The names of the elements in document order.
 */
function documentOrder(elements: Record<string, Element>): string[] {
  return Object.entries(elements)
    .sort(([, a], [, b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    .map(([name]) => name);
}

function getDescription(element: Element): string | undefined {
  return element
    .getAttribute('aria-describedby')
    ?.split(' ')
    .map((id) => element.ownerDocument.getElementById(id)?.textContent)
    .join(' ');
}

it('should render the help text and errors between the label and the input if helpPosition is above', async () => {
  const container = await mountForm({ fields: fieldsWithHelp, helpPosition: 'above' });
  const screen = within(container);
  await submitForm(container);
  await waitFor(() => screen.getByText('Pick a product'));

  const name = getInputByLabel(container, 'Name');
  expect(
    documentOrder({
      error: screen.getByText('Name is required'),
      help: screen.getByText('Your full name'),
      input: name,
      label: screen.getByText('Name'),
    }),
  ).toStrictEqual(['label', 'help', 'error', 'input']);
  expect(name.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(name)).toBe('Your full name Name is required');

  const red = screen.getByRole('radio', { name: 'Red' });
  expect(
    documentOrder({
      error: screen.getByText('Color is required'),
      input: red,
      label: screen.getByText('Color'),
    }),
  ).toStrictEqual(['label', 'error', 'input']);
  expect(red.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(red)).toBe('Color is required');

  expect(
    documentOrder({
      error: screen.getByText('Pick a product'),
      input: screen.getByRole('button', { name: 'Add' }),
      label: screen.getByText('Products'),
    }),
  ).toStrictEqual(['label', 'error', 'input']);
});

it('should render the help text and errors below the input by default', async () => {
  const container = await mountForm({ fields: fieldsWithHelp });
  const screen = within(container);
  expect(
    documentOrder({
      help: screen.getByText('Your full name'),
      input: getInputByLabel(container, 'Name'),
      label: screen.getByText('Name'),
    }),
  ).toStrictEqual(['label', 'input', 'help']);

  await submitForm(container);
  await waitFor(() => screen.getByText('Pick a product'));

  const name = getInputByLabel(container, 'Name');
  expect(
    documentOrder({
      error: screen.getByText('Name is required'),
      input: name,
      label: screen.getByText('Name'),
    }),
  ).toStrictEqual(['label', 'input', 'error']);
  expect(screen.queryByText('Your full name')).toBeNull();
  expect(getDescription(name)).toBe('Name is required');

  expect(
    documentOrder({
      error: screen.getByText('Color is required'),
      input: screen.getByRole('radio', { name: 'Red' }),
    }),
  ).toStrictEqual(['input', 'error']);
  expect(
    documentOrder({
      error: screen.getByText('Pick a product'),
      input: screen.getByRole('button', { name: 'Add' }),
    }),
  ).toStrictEqual(['input', 'error']);
});

it('should summarize only the first error above the submit button by default', async () => {
  const container = await mountForm({ fields: fieldsWithHelp });
  const screen = within(container);
  await submitForm(container);

  const summary = await vi.waitFor(() =>
    screen.getByText('Please fix the following errors:').closest('[role="alert"]')!,
  );
  expect(summary.textContent).toBe('Please fix the following errors:Name: Name is required');
  expect(
    documentOrder({
      products: screen.getByText('Products'),
      submit: screen.getByRole('button', { name: 'Submit' }),
      summary,
    }),
  ).toStrictEqual(['products', 'summary', 'submit']);
  expect(document.activeElement).not.toBe(summary);
});

it('should summarize every error at the top of the form if errorSummaryPosition is top', async () => {
  const container = await mountForm({
    errorSummaryPosition: 'top',
    fields: [
      {
        label: 'Email',
        name: 'email',
        requirements: [{ regex: '@', errorMessage: 'Email is invalid' }],
        type: 'string',
      },
      {
        label: 'Name',
        name: 'name',
        requirements: [{ required: true, errorMessage: 'Name is required' }],
        type: 'string',
      },
    ],
    title: 'Contact',
  });
  const screen = within(container);
  // The email only becomes invalid after the name, but the summary lists the errors in field order.
  const email = getInputByLabel(container, 'Email');
  email.value = 'ada';
  email.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await waitFor(() => screen.getByText('Email is invalid'));

  await submitForm(container);

  const summary = await vi.waitFor(() =>
    screen.getByRole('region', { name: 'Please fix the following errors:' }),
  );
  expect(
    within(summary)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toStrictEqual(['Email: Email is invalid', 'Name: Name is required']);
  expect(
    documentOrder({
      email,
      summary,
      title: screen.getByText('Contact'),
    }),
  ).toStrictEqual(['title', 'summary', 'email']);

  await userEvent.click(within(summary).getByRole('button', { name: 'Name: Name is required' }));
  expect(document.activeElement).toBe(getInputByLabel(container, 'Name'));
});

it('should scroll to and focus the error summary at the top after a failed submit', async () => {
  const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
  const container = await mountForm({ errorSummaryPosition: 'top', fields: fieldsWithHelp });
  const screen = within(container);
  await submitForm(container);

  const summary = await vi.waitFor(() =>
    screen.getByRole('region', { name: 'Please fix the following errors:' }),
  );
  await waitFor(() => expect(document.activeElement).toBe(summary));
  expect(scrollIntoView.mock.contexts).toStrictEqual([summary]);
});
