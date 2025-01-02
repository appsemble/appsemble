import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { TextArea } from './index.js';

it('should fire onChange function', () => {
  const onChange = vi.fn();
  render(<TextArea data-testid="textarea-test" onChange={onChange} />);
  const textArea = screen.getByTestId('textarea-test');
  fireEvent.change(textArea, { target: { value: 'Textarea text here' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({}), 'Textarea text here');
});

it('should render a textarea component', () => {
  const onChange = vi.fn();
  render(<TextArea data-testid="textarea-test" onChange={onChange} />);
  const textArea = screen.getByTestId('textarea-test');
  expect(textArea).toMatchSnapshot();
});

it('should a textarea with appropriate class names', () => {
  const onChange = vi.fn();
  render(
    <>
      <TextArea data-testid="textarea-test" error onChange={onChange} />
      <TextArea data-testid="textarea-test-loading" loading />
    </>,
  );
  const textArea = screen.getByTestId('textarea-test');
  expect(textArea.classList).toContain('is-danger');
  const textAreaLoading = screen.getByTestId('textarea-test-loading');
  expect(textAreaLoading.classList).toContain('is-loading');
});

it('should render a readonly textarea', () => {
  render(<TextArea data-testid="textarea-test" readOnly />);
  const textArea = screen.getByTestId('textarea-test');
  expect(textArea.attributes.getNamedItem('readOnly')).not.toBeNull();
  expect(textArea.classList).toContain('has-background-white-bis');
});
