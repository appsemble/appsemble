import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import { type InputProps, type StaticField as StaticFieldType } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';

type StaticFieldProps = Omit<InputProps<string, StaticFieldType>, 'onChange'>;

/**
 * Render static text in between form elements.
 */
export function StaticField({ className, field, formValues }: StaticFieldProps): VNode {
  const { utils } = useBlock();
  const value = getValueByNameSequence(field.name, formValues);
  const content = utils.remap(field.content, value) as string;
  const tag = utils.remap(field.tag, value) as string;
  const label = utils.remap(field.label, value) as string;

  return (
    <FormComponent
      className={classNames('appsemble-static', className)}
      disableHelp
      help={utils.remap(field.help, value) as string}
      inline={field.inline}
      label={utils.remap(label, value) as string}
      required
      tag={utils.remap(tag, value) as string}
    >
      <div>{content}</div>
    </FormComponent>
  );
}
