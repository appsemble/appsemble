import { fireEvent, render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { Button } from './index.js';
import { IconProvider } from '../IconProvider/index.js';

function wrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <IconProvider apiUrl="https://example.com" appId={42} registry={undefined}>
      {children}
    </IconProvider>
  );
}

function Link({
  children,
  to,
  ...props
}: {
  readonly children: ComponentChildren;
  readonly to: string;
}): VNode {
  return (
    <a href={`/app${to}`} {...props}>
      {children}
    </a>
  );
}

it('should render a button with text `test`', () => {
  render(<Button>test</Button>);
  const button = screen.getByText('test');
  expect(button).toMatchSnapshot();
});

it('should execute a function when the button is clicked', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>test</Button>);
  fireEvent.click(screen.getByText('test'));
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
});

it('should support loading state', () => {
  render(<Button loading>test</Button>);
  const button = screen.getByText('test');
  expect(button.classList).toContain('is-loading');
});

it('should support custom classNames', () => {
  render(<Button className="test test-2 test-3">test</Button>);
  const button = screen.getByText('test');
  expect(button.className).toContain('test test-2 test-3');
});

it('should render as a link without a button type', () => {
  render(
    <Button component="a" href="https://example.com">
      test
    </Button>,
  );
  const link = screen.getByRole('link', { name: 'test' });
  expect(link.getAttribute('href')).toBe('https://example.com');
  expect(link.className).toBe('button');
  expect(link.hasAttribute('type')).toBe(false);
});

it('should render as a custom component', () => {
  render(
    <Button component={Link} to="/home">
      test
    </Button>,
  );
  const link = screen.getByRole('link', { name: 'test' });
  expect(link.getAttribute('href')).toBe('/app/home');
  expect(link.className).toBe('button');
});

it('should default the type of a button element to `button`', () => {
  render(<Button>test</Button>);
  expect(screen.getByRole('button').getAttribute('type')).toBe('button');
});

it('should render its icon with the given size, size modifier, color, and position', () => {
  render(
    <Button
      icon="home"
      iconColor="primary"
      iconPosition="right"
      iconSize="large"
      iconSizeModifier="3x"
    >
      test
    </Button>,
    { wrapper },
  );
  const button = screen.getByRole('button', { name: 'test' });
  const icon = button.lastElementChild!;
  expect(icon.className).toBe('icon is-large has-text-primary');
  expect(icon.querySelector('i')!.className).toBe('fas fa-home fa-3x');
});
