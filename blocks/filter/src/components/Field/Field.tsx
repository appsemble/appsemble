/** @jsx h */
import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { Fragment, h, VNode } from 'preact';

import { Filter, FilterField, RangeFilter } from '../../../types';
import Control from '../Control';
import styles from './Field.css';

export interface FieldProps {
  displayLabel?: boolean;
  filter: Filter;
  loading: boolean;
  onChange: (event: Event) => void;
  onRangeChange: (event: Event) => void;
}

export default function Field({
  displayLabel = true,
  filter,
  name,
  onRangeChange,
  onChange,
  range = false,
  label = name,
  icon,
  ...props
}: FieldProps & FilterField): VNode {
  const { messages } = useBlock();

  return (
    <div className="field is-horizontal">
      {displayLabel && (
        <div className="field-label is-normal">
          <label className="label" htmlFor={`filter${name}`}>
            {icon && (
              <span className="icon">
                <i className={`fas fa-${icon}`} />
              </span>
            )}
            {label}
          </label>
        </div>
      )}
      <div className={classNames('field field-body', { 'is-grouped': range })}>
        {range ? (
          <Fragment>
            <Control
              id={`from${name}`}
              name={name}
              onChange={onRangeChange}
              placeholder={messages.from.format()}
              value={filter[name] && (filter[name] as RangeFilter).from}
              {...props}
            />
            <Control
              id={`to${name}`}
              name={name}
              onChange={onRangeChange}
              placeholder={messages.to.format()}
              value={filter[name] && (filter[name] as RangeFilter).to}
              {...props}
            />
          </Fragment>
        ) : (
          <Control
            className={styles.control}
            id={name}
            name={name}
            onChange={onChange}
            value={filter[name]}
            {...props}
          />
        )}
      </div>
    </div>
  );
}
