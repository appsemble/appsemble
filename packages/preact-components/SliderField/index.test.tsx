import { render } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { SliderField } from './index.js';

it('should render a slider field', () => {
  const { container } = render(<SliderField optionalLabel="(Optional)" value="test" />);
  expect(container).toMatchSnapshot();
});
