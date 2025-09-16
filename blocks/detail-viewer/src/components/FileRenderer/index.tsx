import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type FileField, type RendererProps } from '../../../block.js';
import { ImageField } from '../ImageField/index.js';

/**
 * Renders a file as an image.
 */
export function FileRenderer({ data, field }: RendererProps<FileField>): VNode | null {
  const { utils } = useBlock();
  const value = utils.remap(field.value, data);
  const label = utils.remap(field.label, data);
  const hide = utils.remap(field.hide, data);

  return hide ? null : (
    <div className="appsemble-file">
      {isPreactChild(label) && <h6 className="title is-6">{label}</h6>}
      {field.repeated ? (
        <div className={classNames('container', styles.repeated)}>
          {((value || []) as string[]).map((v, index) => (
            <ImageField
              field={field}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              label={label}
              name={field.value}
              source={field.repeatedName ? (utils.remap(field.repeatedName, v) as string) : v}
            />
          ))}
        </div>
      ) : (
        value && (
          <ImageField field={field} label={label} name={field.value} source={value as string} />
        )
      )}
    </div>
  );
}
