import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

interface TableProps {
  /**
   * Add borders to all the cells.
   */
  bordered?: boolean;

  /**
   * A `<thead />`, `<tbody />` and `<tfoot />` element.
   */
  children: ReactNode;

  /**
   * An optional class name to add to the table container.
   */
  className?: string;

  /**
   * You can have a fullwidth table.
   */
  fullwidth?: boolean;

  /**
   * You can add a hover effect on each row.
   */
  hoverable?: boolean;

  /**
   * Make the cells narrower.
   */
  narrow?: boolean;

  /**
   * Add stripes to the table.
   */
  striped?: boolean;
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
