import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { type MutableRef, useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { type Field, type FormDisplay, type InputProps, type Values } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { BooleanInput } from '../BooleanInput/index.js';
import { DateInput } from '../DateInput/index.js';
import { DateTimeInput } from '../DateTimeInput/index.js';
import { EnumInput } from '../EnumInput/index.js';
import { Fieldset } from '../Fieldset/index.js';
import { FileInput } from '../FileInput/index.js';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput/index.js';
import { ListInput } from '../ListInput/index.js';
import { MarkdownInput } from '../MarkdownInput/index.js';
import { NumberInput } from '../NumberInput/index.js';
import { RadioInput } from '../RadioInput/index.js';
import { RangeInput } from '../RangeInput/index.js';
import { SelectionInput } from '../SelectionInput/index.js';
import { StaticField } from '../StaticField/index.js';
import { StringInput } from '../StringInput/index.js';
import { TagsInput } from '../TagsInput/index.js';

interface FormInputProps extends Omit<InputProps<any, Field>, 'dirty' | 'errorLinkRef'> {
  readonly display?: FormDisplay;
  readonly setFieldErrorLink?: (
    fieldName: string,
    params: { ref: MutableRef<HTMLElement>; error: string; label: string },
  ) => void;
  readonly addThumbnail: (thumbnail: File) => void;
  readonly removeThumbnail: (thumbnail: File) => void;
  readonly fieldsetEntryValues?: Values;
}

/**
 * Render any type of form input.
 */
export function FormInput({ field, onChange, ...props }: FormInputProps): VNode {
  const [dirty, setDirty] = useState(false);
  const { utils } = useBlock();

  const errorLinkRef = useRef<HTMLElement>();

  const { error, formValues, setFieldErrorLink } = props;

  const fieldValue = getValueByNameSequence(field.name, formValues) as string;
  const remappedLabel = utils.remap(field?.label, fieldValue) ?? field.name;

  useEffect(() => {
    if (error && typeof error === 'string') {
      setFieldErrorLink(field.name, { ref: errorLinkRef, error, label: remappedLabel as string });
    } else {
      setFieldErrorLink(field.name, null);
    }
  }, [error, field.name, remappedLabel, setFieldErrorLink]);

  const handleChange = useCallback(
    (event: never, value: any) => {
      setDirty(true);
      onChange(field.name, value);
    },
    [field, onChange],
  );

  switch (field.type) {
    case 'date':
      return (
        <DateInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'date-time':
      return (
        <DateTimeInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'enum':
      return (
        <EnumInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'file':
      return (
        <FileInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'geocoordinates':
      return (
        <GeoCoordinatesInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'list':
      return (
        <ListInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={onChange}
          {...props}
        />
      );
    case 'static':
      return <StaticField errorLinkRef={errorLinkRef} field={field} {...props} />;
    case 'string':
      return (
        <StringInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'range':
      return (
        <RangeInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'number':
    case 'integer':
      return (
        <NumberInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'boolean':
      return (
        <BooleanInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'fieldset':
      return (
        <Fieldset
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          setFieldErrorLink={setFieldErrorLink}
          {...props}
        />
      );
    case 'radio':
      return (
        <RadioInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'tags':
      return (
        <TagsInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'selection':
      return (
        <SelectionInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    case 'markdown':
      return (
        <MarkdownInput
          dirty={dirty}
          errorLinkRef={errorLinkRef}
          field={field}
          onChange={handleChange}
          {...props}
        />
      );
    default:
  }
}
