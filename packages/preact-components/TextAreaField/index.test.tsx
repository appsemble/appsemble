import { render } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { TextAreaField } from './index.js';

it('should render a field with textarea', () => {
  const { container } = render(<TextAreaField />);
  expect(container).toMatchSnapshot();
});
