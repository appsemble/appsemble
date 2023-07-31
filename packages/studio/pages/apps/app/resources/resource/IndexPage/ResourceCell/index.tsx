import { Checkbox } from '@appsemble/react-components';
import { type Schema, Validator } from 'jsonschema';
import { type ReactElement, type ReactNode } from 'react';
import { FormattedDate, FormattedMessage, FormattedNumber } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

const validator = new Validator();
const firstLineRegex = /^(.*)\n?/;
const whitespaceRegex = /^\s+$/;

interface ResourceCellProps {
  readonly required: boolean;
  readonly schema: Schema;
  readonly value: unknown;
}

export function ResourceCell({ required, schema, value }: ResourceCellProps): ReactElement {
  const { valid } = validator.validate(value, { required, ...schema }, { nestedErrors: true });
  const classes = [styles.root];
  let content: ReactNode;
  let title: string;

  if (!valid) {
    classes.push('has-text-danger');
  }

  if (value === undefined) {
    if (valid) {
      classes.push('has-text-grey-light');
    }
    classes.push(styles.noSelect);
    content = <FormattedMessage {...messages.undefined} />;
  } else if (value == null) {
    if (valid) {
      classes.push('has-text-grey-light');
    }
    classes.push(styles.noSelect);
    content = <FormattedMessage {...messages.null} />;
  } else if (value === '') {
    if (valid) {
      classes.push('has-text-grey-light');
    }
    classes.push(styles.noSelect);
    content = <FormattedMessage {...messages.emptyString} />;
    title = "''";
  } else if (typeof value === 'boolean') {
    classes.push(styles.boolean);
    content = <Checkbox disabled onChange={null} value={value} />;
    title = String(value);
  } else if (typeof value === 'number') {
    classes.push(styles.number);
    content = <FormattedNumber value={value as number} />;
  } else if (typeof value === 'object') {
    content = JSON.stringify(value);
    title = JSON.stringify(value, undefined, 2);
  } else if (typeof value === 'string') {
    const processUnknownString = (): void => {
      if (whitespaceRegex.test(value)) {
        content = <FormattedMessage {...messages.whitespace} />;
        title = value;
        if (valid) {
          classes.push('has-text-grey-light');
        }
        classes.push(styles.noSelect);
      } else {
        const [match, firstLine] = firstLineRegex.exec(value);
        content = firstLine;
        if (match !== firstLine) {
          title = value;
          classes.push(styles.multiline);
        }
      }
    };
    if (valid) {
      if (schema.format === 'date') {
        title = value;
        content = (
          <time dateTime={value}>
            <FormattedDate day="numeric" month="short" value={value} year="numeric" />
          </time>
        );
      } else if (schema.format === 'date-time') {
        title = value;
        content = (
          <time dateTime={value}>
            <FormattedDate
              day="numeric"
              hour="numeric"
              minute="numeric"
              month="short"
              value={value}
              year="numeric"
            />
          </time>
        );
      } else if (schema.format === 'email') {
        content = <a href={`mailto:${value}`}>{value}</a>;
      } else if (schema.format === 'password') {
        content = '••••••••••••';
        classes.push(styles.noSelect, 'has-text-grey-light');
      } else if (schema.format === 'uri') {
        content = (
          <a href={value} rel="noopener noreferrer" target="_blank">
            {value}
          </a>
        );
      } else {
        processUnknownString();
      }
    } else {
      processUnknownString();
    }
  }

  return (
    <td className={classes.join(' ')} title={title}>
      {content}
    </td>
  );
}
