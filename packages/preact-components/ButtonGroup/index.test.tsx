import { render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ButtonGroup } from './index.js';
import { Button } from '../Button/index.js';

it('should render a group of buttons', () => {
  const onChange = vi.fn();
  const { container } = render(
    <ButtonGroup onChange={onChange} value="meh">
      <Button>Button</Button>
    </ButtonGroup>,
  );
  expect(container).toMatchSnapshot();
});

it('should correctly apply the class names', () => {
  const onChange = vi.fn();
  const { container } = render(
    <ButtonGroup className="test-class" onChange={onChange} value="meh">
      <Button>Button</Button>
    </ButtonGroup>,
  );
  expect(container.firstElementChild.classList).toContain('test-class');
});
