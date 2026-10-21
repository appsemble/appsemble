import { render } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { SelectField } from './index.js';

it('should render a select field', () => {
  const { container } = render(<SelectField optionalLabel="(Optional)" value="test" />);
  expect(container).toMatchSnapshot();
});
