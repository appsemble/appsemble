import { type BlockProps, Context } from '@appsemble/preact';
import { fa, resolveIcon } from '@appsemble/web-utils';
import { render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it } from 'vitest';

import { getDescription } from './getDescription.js';
import { FormComponent, FormComponentError, FormComponentHelpPositionContext } from './index.js';
import { Input } from '../Input/index.js';

const block = {
  utils: { fa, resolveIcon: (reference: string) => resolveIcon(reference) },
} as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

function HelpAboveProvider({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <Provider>
      <FormComponentHelpPositionContext.Provider value="above">
        {children}
      </FormComponentHelpPositionContext.Provider>
    </Provider>
  );
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

it('should render a form component with children elements', () => {
  render(
    <FormComponent>
      <Input />
      <Input />
    </FormComponent>,
  );
  const testForm = screen.getByTestId('submit-formcomp');
  expect(testForm).toMatchSnapshot();
});

it('should render a help text', () => {
  render(
    <FormComponent help="test text">
      <Input />
      <Input />
    </FormComponent>,
  );
  const helpText = screen.getByTestId('help-formcomp');
  expect(screen.getByTestId('submit-formcomp').children[1]).toBeInstanceOf(HTMLSpanElement);

  expect(helpText.textContent).toBe('test text');
});

it('should not render a help text if disableHelp is set to true', () => {
  render(
    <FormComponent disableHelp help="test text">
      <Input />
      <Input />
    </FormComponent>,
  );
  expect(screen.getByTestId('submit-formcomp').children[1]).toBeUndefined();
});

it('should render error text with a status icon', () => {
  render(
    <FormComponent error="this is an error">
      <Input />
      <Input />
    </FormComponent>,
    { wrapper: Provider },
  );
  const helpText = screen.getByText('this is an error').closest('.help')!;
  expect(helpText.classList).toContain('is-danger');
  expect(helpText.querySelector('.icon .fa-circle-xmark')).not.toBeNull();
});

it('should render detailed help text', () => {
  render(
    <FormComponent help="help" helpExtra="this is detailed help">
      <Input />
      <Input />
    </FormComponent>,
  );
  const detailedHelp = screen.getByTestId('help-extra-formcomp');
  expect(detailedHelp.textContent).toBe('this is detailed help');
});

it('should render the specified optional label if the field has a label', () => {
  render(
    <FormComponent label="test label" optionalLabel="Optional label">
      <Input />
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('tag-formcomp');
  expect(optionalLabel.textContent).toBe('Optional label');
});

it('should render the default optional label', () => {
  render(
    <FormComponent label="test label">
      <Input />
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('tag-formcomp');
  expect(optionalLabel.textContent).toBe('(Optional)');
});

it('should render a label', () => {
  render(
    <FormComponent label="test label" required>
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('label-formcomp');
  expect(screen.getByTestId('label-formcomp')).toBeInstanceOf(HTMLLabelElement);
  expect(optionalLabel.textContent).toBe('test label');
});

it('should describe a valid input by its help text', () => {
  render(
    <FormComponent help="Enter your full name" id="name" label="Name">
      <Input id="name" />
    </FormComponent>,
  );
  const input = screen.getByLabelText(/Name/);
  expect(input.getAttribute('aria-invalid')).toBeNull();
  expect(getDescription(input)).toBe('Enter your full name');
});

it('should mark an input with an error as invalid and describe it by the error', () => {
  render(
    <FormComponent
      error="This field is required"
      help="Enter your full name"
      id="name"
      label="Name"
    >
      <Input id="name" />
    </FormComponent>,
    { wrapper: Provider },
  );
  const input = screen.getByLabelText(/Name/);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(input)).toBe('This field is required');
});

it('should not describe an input if the help is disabled', () => {
  render(
    <FormComponent disableHelp help="Enter your full name" id="name" label="Name">
      <Input id="name" />
    </FormComponent>,
  );
  expect(screen.getByLabelText(/Name/).hasAttribute('aria-describedby')).toBe(false);
});

it('should render the help text and error between the label and the input if help is above', () => {
  render(
    <FormComponent
      error="This field is required"
      help="Enter your full name"
      helpExtra="0 / 20"
      id="name"
      label="Name"
    >
      <Input id="name" />
    </FormComponent>,
    { wrapper: HelpAboveProvider },
  );
  const input = screen.getByLabelText(/Name/);
  expect(
    documentOrder({
      counter: screen.getByText('0 / 20'),
      error: screen.getByText('This field is required'),
      help: screen.getByText('Enter your full name'),
      input,
      label: screen.getByText('Name'),
    }),
  ).toStrictEqual(['label', 'help', 'counter', 'error', 'input']);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(input)).toBe('Enter your full name This field is required');
});

it('should describe a valid input by its help text if help is above', () => {
  render(
    <FormComponent help="Enter your full name" id="name" label="Name">
      <Input id="name" />
    </FormComponent>,
    { wrapper: HelpAboveProvider },
  );
  const input = screen.getByLabelText(/Name/);
  expect(documentOrder({ help: screen.getByText('Enter your full name'), input })).toStrictEqual([
    'help',
    'input',
  ]);
  expect(input.getAttribute('aria-invalid')).toBeNull();
  expect(getDescription(input)).toBe('Enter your full name');
});

it('should render the error of a form component error above its controls if help is above', () => {
  render(
    <FormComponent help="Choose a size" id="size" label="Size">
      <FormComponentError error="Size is required">
        <Input id="size" />
      </FormComponentError>
    </FormComponent>,
    { wrapper: HelpAboveProvider },
  );
  const input = screen.getByLabelText(/Size/);
  expect(
    documentOrder({
      error: screen.getByText('Size is required'),
      help: screen.getByText('Choose a size'),
      input,
      label: screen.getByText('Size'),
    }),
  ).toStrictEqual(['label', 'help', 'error', 'input']);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(input)).toBe('Choose a size Size is required');
});

it('should render the error of a form component error below its controls by default', () => {
  render(
    <FormComponent help="Choose a size" id="size" label="Size">
      <FormComponentError error="Size is required">
        <Input id="size" />
      </FormComponentError>
    </FormComponent>,
    { wrapper: Provider },
  );
  const input = screen.getByLabelText(/Size/);
  expect(
    documentOrder({
      error: screen.getByText('Size is required'),
      help: screen.getByText('Choose a size'),
      input,
      label: screen.getByText('Size'),
    }),
  ).toStrictEqual(['label', 'input', 'error', 'help']);
  expect(getDescription(input)).toBe('Choose a size Size is required');
});
