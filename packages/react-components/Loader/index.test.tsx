import { render } from '@testing-library/react';

import { Loader } from '.';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const { container } = render(<Loader />);
    expect(container).toMatchSnapshot();
  });
});
