import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { InputField } from './index.js';

it('should always show the character count if the field has a maximum length', () => {
  render(<InputField maxLength={10} name="name" optionalLabel="(Optional)" value="abc" />);
  expect(screen.getByText('3 / 10')).toBeInstanceOf(HTMLElement);
});

it('should show the character count past the threshold only', () => {
  const { rerender } = render(
    <InputField
      counterThreshold={0.8}
      maxLength={10}
      name="name"
      optionalLabel="(Optional)"
      value="abcdefgh"
    />,
  );
  expect(screen.queryByText('8 / 10')).toBeNull();

  rerender(
    <InputField
      counterThreshold={0.8}
      maxLength={10}
      name="name"
      optionalLabel="(Optional)"
      value="abcdefghi"
    />,
  );
  expect(screen.getByText('9 / 10')).toBeInstanceOf(HTMLElement);
});
