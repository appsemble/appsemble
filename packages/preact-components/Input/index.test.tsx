import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Input } from './index.js';

it('should fire the onChange function', () => {
  const onChange = vi.fn();
  render(<Input data-testid="input-testid" onChange={onChange} />);
  const input = screen.getByTestId('input-testid');
  fireEvent.input(input, { target: { value: 'test input' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({}), 'test input');
});

it('should render an input element', () => {
  render(<Input data-testid="input-testid" />);
  const input = screen.getByTestId('input-testid');
  expect(input).toMatchSnapshot();
});

it('should render matching auto-suggestions', () => {
  render(<Input data-testid="input-testid" datalist={['test suggestion', 'test auto']} />);
  const datalist = screen.getByTestId('test-id-datalist');
  expect(datalist).toBeInstanceOf(HTMLDataListElement);
  expect(datalist.children).toBeInstanceOf(HTMLCollection);
  expect(datalist.children).toHaveLength(2);
  expect(datalist.children.item(0).outerHTML).toBe('<option value="test suggestion"></option>');
  expect(datalist.children.item(1).outerHTML).toBe('<option value="test auto"></option>');
});

it('should render an input element with appropriate classnames', () => {
  render(
    <div>
      <Input data-testid="input-error" error />
      <Input data-testid="input-loading" loading />
    </div>,
  );
  const input = screen.getByTestId('input-error');
  expect(input.classList).toContain('is-danger');
  const inputLoading = screen.getByTestId('input-loading');
  expect(inputLoading.classList).toContain('is-loading');
});

it('should render a readonly input element', () => {
  const onChange = vi.fn();
  render(<Input data-testid="input-testid" onChange={onChange} readOnly />);
  const input = screen.getByTestId('input-testid');
  expect(input.attributes.getNamedItem('readOnly')).not.toBeNull();
  expect(input.classList).toContain('has-background-white-bis');
});
