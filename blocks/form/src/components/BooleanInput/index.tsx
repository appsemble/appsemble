import { useBlock } from '@appsemble/preact';
import { CheckboxField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type ComponentChild, Fragment, type JSX, type VNode } from 'preact';
import * as jsxRuntime from 'preact/compat/jsx-runtime';
import { useMemo } from 'preact/hooks';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { type BooleanField, type InputProps } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * A link that opens in a new tab, so following it keeps the state of the page the form is on.
 */
function Anchor({ children, href, ...props }: JSX.IntrinsicElements['a']): VNode {
  return (
    <a {...props} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

// Paragraphs are unwrapped, so the label stays on one line next to the checkbox.
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  // @ts-expect-error works anyways
  .use(rehypeReact, { ...jsxRuntime, components: { a: Anchor, p: Fragment } });

/**
 * An input element for a boolean value.
 */
export function BooleanInput({
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
}: BooleanInputProps): VNode {
  const { utils } = useBlock();
  const {
    color,
    help,
    icon,
    inline,
    label,
    labelText,
    labelTextFormat,
    size,
    switch: switchType,
    tag,
  } = field;

  const value = getValueByNameSequence(name, formValues);
  const checkboxLabel = utils.remap(label, value);
  const remappedLabelText = utils.remap(labelText, value);
  const required = isRequired(field, utils, formValues);

  const markdownLabelText = useMemo<ComponentChild>(
    () =>
      labelTextFormat === 'markdown' && typeof remappedLabelText === 'string'
        ? (markdownProcessor.processSync(remappedLabelText).result as ComponentChild)
        : null,
    [labelTextFormat, remappedLabelText],
  );

  return (
    <CheckboxField
      className={classNames('appsemble-boolean', className, { 'is-danger': error })}
      color={color}
      disabled={disabled}
      error={dirty ? error : null}
      errorLinkRef={errorLinkRef}
      help={utils.remap(help, value) as string}
      icon={icon}
      inline={inline}
      label={checkboxLabel as string}
      name={name}
      onChange={onChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      readOnly={readOnly}
      required={required}
      size={size}
      switch={Boolean(switchType)}
      switchOptions={switchType}
      tag={utils.remap(tag, value) as string}
      title={
        markdownLabelText ?? (remappedLabelText as string) ?? (checkboxLabel as string) ?? null
      }
      value={Boolean(value)}
    />
  );
}
