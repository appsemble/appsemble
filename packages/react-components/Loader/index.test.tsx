import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Loader } from './index.js';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const { container } = render(<Loader />);
    expect(container).toMatchSnapshot();
  });
});
