import { render } from '@testing-library/react';

import { Loader } from './index.js';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const { container } = render(<Loader />);
    expect(container).toMatchSnapshot();
  });
});
