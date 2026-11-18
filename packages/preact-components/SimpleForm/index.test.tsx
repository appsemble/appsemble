import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { SimpleForm } from './index.js';
import { IconProvider } from '../IconProvider/index.js';
import { SimpleFormError } from '../SimpleFormError/index.js';
import { SimpleFormField } from '../SimpleFormField/index.js';
import { SimpleSubmit } from '../SimpleSubmit/index.js';

function wrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <IconProvider apiUrl="https://example.com" appId={42} registry={undefined}>
      {children}
    </IconProvider>
  );
}

it('should submit the entered values', async () => {
  const onSubmit = vi.fn();
  render(
    <SimpleForm defaultValues={{ name: '' }} onSubmit={onSubmit}>
      <SimpleFormField label="Name" name="name" />
      <SimpleSubmit>Save</SimpleSubmit>
    </SimpleForm>,
    { wrapper },
  );

  fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' }));
});

it('should show the validity message and block submitting an invalid value', () => {
  render(
    <SimpleForm defaultValues={{ name: 'Alice' }} onSubmit={vi.fn()}>
      <SimpleFormField
        label="Name"
        name="name"
        required
        validityMessages={{ valueMissing: 'Name is required' }}
      />
      <SimpleSubmit>Save</SimpleSubmit>
    </SimpleForm>,
    { wrapper },
  );

  fireEvent.input(screen.getByLabelText('Name'), { target: { value: '' } });

  expect(screen.getByText('Name is required')).toBeDefined();
  expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
});

it('should keep the submit button disabled until a value changes if pristine forms are not allowed', () => {
  render(
    <SimpleForm defaultValues={{ name: '' }} onSubmit={vi.fn()}>
      <SimpleFormField label="Name" name="name" />
      <SimpleSubmit allowPristine={false}>Save</SimpleSubmit>
    </SimpleForm>,
    { wrapper },
  );
  const button = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;

  expect(button.disabled).toBe(true);
  fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
  expect(button.disabled).toBe(false);
});

it('should show the submit error if submitting fails', async () => {
  render(
    <SimpleForm
      defaultValues={{ name: 'Alice' }}
      onSubmit={() => Promise.reject(new Error('Network down'))}
    >
      <SimpleFormError>{({ error }) => <span>{error.message}</span>}</SimpleFormError>
      <SimpleSubmit>Save</SimpleSubmit>
    </SimpleForm>,
    { wrapper },
  );

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Network down')).toBeDefined();
});

it('should reset the values after a successful submit if requested', async () => {
  render(
    <SimpleForm defaultValues={{ name: '' }} onSubmit={vi.fn()} resetOnSuccess>
      <SimpleFormField label="Name" name="name" />
      <SimpleSubmit>Save</SimpleSubmit>
    </SimpleForm>,
    { wrapper },
  );
  const input = screen.getByLabelText('Name') as HTMLInputElement;

  fireEvent.input(input, { target: { value: 'Alice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(input.value).toBe(''));
});
