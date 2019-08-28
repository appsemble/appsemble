/** @jsx h */
import { Component, h, VNode } from 'preact';

import { InputProps } from '../../../block';
import FileEntry from './FileEntry';
import styles from './FileInput.css';

type FileInputProps = InputProps<string | Blob | (string | Blob)[]>;

export default class FileInput extends Component<FileInputProps> {
  static defaultProps: Partial<FileInputProps> = {
    value: [],
  };

  onChange = (event: Event, val: string) => {
    const { field, onChange, value } = this.props;

    const copy = [...value];
    const index = Number((event.target as HTMLInputElement).name.split('.').pop());
    if (val == null) {
      copy.splice(index, 1);
    } else {
      copy[index] = val;
    }
    onChange(({ target: { name: field.name } } as any) as Event, copy);
  };

  render(): VNode {
    const { field, onChange, value } = this.props;

    return field.repeated ? (
      <div className={styles.repeatedContainer}>
        <FileEntry
          field={field}
          name={`${field.name}.${(value as string[]).length}`}
          onChange={this.onChange}
        />
        {(value as string[]).map((val, index) => (
          <FileEntry
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            field={field}
            name={`${field.name}.${index}`}
            onChange={this.onChange}
            value={val}
          />
        ))}
      </div>
    ) : (
      <FileEntry field={field} name={field.name} onChange={onChange} value={value as string} />
    );
  }
}
