/** @jsx h */
import { Component, h, VNode } from 'preact';

import { FileField, InputProps } from '../../../block';
import FileEntry from './FileEntry';
import styles from './FileInput.css';

type FileInputProps = InputProps<string | Blob | (string | Blob)[], FileField>;

export default class FileInput extends Component<FileInputProps> {
  static defaultProps: Partial<FileInputProps> = {
    value: [],
  };

  onInput = (event: Event, val: string): void => {
    const { field, onInput, value } = this.props;

    const copy = [].concat(value);
    const index = Number((event.target as HTMLInputElement).name.split('.').pop());
    if (val == null) {
      copy.splice(index, 1);
    } else {
      copy[index] = val;
    }
    onInput(({ target: { name: field.name } } as any) as Event, copy);
  };

  render(): VNode {
    const { field, onInput, value } = this.props;

    return field.repeated ? (
      <div className={styles.repeatedContainer}>
        <FileEntry
          field={field}
          name={`${field.name}.${(value as string[]).length}`}
          onInput={this.onInput}
        />
        {(value as string[]).map((val, index) => (
          <FileEntry
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            field={field}
            name={`${field.name}.${index}`}
            onInput={this.onInput}
            value={val}
          />
        ))}
      </div>
    ) : (
      <FileEntry field={field} name={field.name} onInput={onInput} value={value as string} />
    );
  }
}
