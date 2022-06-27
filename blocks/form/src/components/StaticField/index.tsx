import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { InputProps, StaticField as StaticFieldType } from '../../../block';

type StaticFieldProps = Omit<InputProps<string, StaticFieldType>, 'onChange'>;

/**
 * Render static text in between form elements.
 */
export function StaticField({ className, field, value }: StaticFieldProps): VNode {
  const { utils } = useBlock();
  const content = utils.remap(field.content, value) as string;
  const tag = utils.remap(field.tag, value) as string;
  const label = utils.remap(field.label, value) as string;

  return (
    <FormComponent
      className={classNames('appsemble-static', className)}
      disableHelp
      label={utils.remap(label, value) as string}
      required
      tag={utils.remap(tag, value) as string}
    >
      <div>{content}</div>
    </FormComponent>
  );
}
