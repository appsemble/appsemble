import { useBlock } from '@appsemble/preact';
import { TagsField } from '@appsemble/preact-components';
import { type NamedEvent } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type MutableRef } from 'preact/hooks';

import styles from './index.module.css';
import {
  type InputProps,
  type RegexRequirement,
  type TagsField as TagsFieldInterface,
} from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMinItems } from '../../utils/requirements.js';

type TagsInputProps = InputProps<string[], TagsFieldInterface>;

export function TagsInput({
  className,
  dirty,
  disabled,
  error,
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: TagsInputProps): VNode {
  const { utils } = useBlock();
  const { help, icon, inline, label, placeholder, tag } = field;

  const value = getValueByNameSequence(name, formValues) as string[];
  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames(styles['appsemble-tags'], 'mb-4', className),
    disabled,
    error: dirty && error,
    help: utils.remap(help, value) as string,
    icon,
    label: remappedLabel as string,
    name,
    onChange(e: NamedEvent<HTMLInputElement, HTMLInputElement>, changedValue: string[]) {
      onChange(name, changedValue);
    },
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required: (getMinItems(field) ?? 0) > 0,
    tag: utils.remap(tag, value) as string,
    value,
    inline,
  };

  return (
    <TagsField
      {...commonProps}
      errorLinkRef={(errorLinkRef as MutableRef<HTMLElement>) || undefined}
      regex={field.requirements?.some((r) => Boolean((r as RegexRequirement).regex))}
    />
  );
}
