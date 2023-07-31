import classNames from 'classnames';
import { type ReactElement, type ReactNode } from 'react';

interface TableProps {
  /**
   * Add borders to all the cells.
   */
  readonly bordered?: boolean;

  /**
   * A `<thead />`, `<tbody />` and `<tfoot />` element.
   */
  readonly children: ReactNode;

  /**
   * An optional class name to add to the table container.
   */
  readonly className?: string;

  /**
   * You can have a fullwidth table.
   */
  readonly fullwidth?: boolean;

  /**
   * You can add a hover effect on each row.
   */
  readonly hoverable?: boolean;

  /**
   * Make the cells narrower.
   */
  readonly narrow?: boolean;

  /**
   * Add stripes to the table.
   */
  readonly striped?: boolean;
}

/**
 * A bulma table in a table-wrapper container with sane defaults.
 */
export function Table({
  bordered,
  children,
  className,
  fullwidth = true,
  hoverable = true,
  narrow,
  striped = true,
}: TableProps): ReactElement {
  return (
    <div className={classNames('table-container', className)}>
      <table
        className={classNames('table', {
          'is-bordered': bordered,
          'is-fullwidth': fullwidth,
          'is-hoverable': hoverable,
          'is-narrow': narrow,
          'is-striped': striped,
        })}
      >
        {children}
      </table>
    </div>
  );
}
