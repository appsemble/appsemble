import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { VNode } from 'preact';

import { FileField, RendererProps } from '../../../block';
import { ImageField } from '../ImageField';
import styles from './index.module.css';

/**
 * Renders a file as an image.
 */
export function FileRenderer({ data, field }: RendererProps<FileField>): VNode {
  const { utils } = useBlock();
  const value = utils.remap(field.value, data);

  return (
    <div className="appsemble-file">
      {field.label && <h6 className="title is-6">{field.label}</h6>}
      {field.repeated ? (
        <div className={classNames('container', styles.repeated)}>
          {((value || []) as string[]).map((v, index) => (
            <ImageField
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              label={field.label}
              name={field.value}
              src={field.repeatedName ? utils.remap(field.repeatedName, v) : v}
            />
          ))}
        </div>
      ) : (
        value && <ImageField label={field.label} name={field.value} src={value} />
      )}
    </div>
  );
}
