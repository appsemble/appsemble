import classNames from 'classnames';
import * as React from 'react';

import useClickOutside from '../hooks/useClickOutside';
import Icon from '../Icon';

interface DropdownProps {
  className?: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

export default function Dropdown({
  children,
  className,
  label,
}: DropdownProps): React.ReactElement {
  const [isActive, setActive] = React.useState();
  const ref = React.useRef<HTMLDivElement>();

  const toggle = React.useCallback(() => {
    setActive(!isActive);
  }, [isActive]);

  const onKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setActive(false);
    }
  }, []);

  useClickOutside(ref, () => {
    setActive(false);
  });

  return (
    <div ref={ref} className={classNames('dropdown', className, { 'is-active': isActive })}>
      <div className="dropdown-trigger">
        <button
          aria-haspopup
          className="button"
          onClick={toggle}
          onKeyDown={onKeyDown}
          type="button"
        >
          {label}
          <Icon icon="angle-down" size="small" />
        </button>
      </div>
      <div
        className="dropdown-menu"
        onClick={toggle}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        <div className="dropdown-content">{children}</div>
      </div>
    </div>
  );
}
