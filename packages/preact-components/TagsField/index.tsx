import { type NamedEvent } from '@appsemble/web-utils';
import BulmaTagsInput, { type BulmaTagsInputOptions } from '@creativebulma/bulma-tagsinput';
import '@creativebulma/bulma-tagsinput/dist/css/bulma-tagsinput.css';
import { type ComponentPropsWithRef, forwardRef } from 'preact/compat';
import { type MutableRef, useEffect, useRef } from 'preact/hooks';

import { InputField, useCombinedRefs } from '../index.js';

type TagsFieldProps = Omit<ComponentPropsWithRef<typeof InputField>, 'onChange' | 'ref' | 'value'> &
  Pick<BulmaTagsInputOptions, 'delimiter'> & {
    readonly onChange: (event: NamedEvent<HTMLInputElement>, value: number[] | string[]) => void;

    readonly value?: string[];

    readonly regex?: boolean;

    /**
     * The ref to the element used for scrolling to the field error
     */
    readonly errorLinkRef?: MutableRef<HTMLElement>;
  };

export const TagsField = forwardRef<HTMLInputElement, TagsFieldProps>(
  ({ delimiter, errorLinkRef, onChange, regex, value, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>();
    const bulmaInputRef = useRef<BulmaTagsInput>();

    const mergedRef = useCombinedRefs(innerRef, ref as MutableRef<HTMLElement>);

    useEffect(() => {
      const element = innerRef.current;

      // @ts-expect-error strictNullChecks not assignable to type
      bulmaInputRef.current = new BulmaTagsInput(element, { delimiter, tagClass: 'tag' });

      const bulmaInputElement = (
        bulmaInputRef.current as any
      ).element.previousElementSibling.querySelector('div.tags-input > input');

      bulmaInputElement.ref = errorLinkRef;
      if (errorLinkRef) {
        // eslint-disable-next-line no-param-reassign
        errorLinkRef.current = bulmaInputElement;
      }
      // Bulma tags input can’t be updated. Don’t support updating the delimiter on the fly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (value) {
        const bulmaInput = bulmaInputRef.current;
        bulmaInput?.flush();
        for (const v of value) {
          bulmaInput?.add(String(v));
        }
      }
    }, [value]);

    useEffect(() => {
      const element = innerRef.current;
      const bulmaInput = bulmaInputRef.current;
      if (!bulmaInput) {
        return;
      }

      const onEvent = (): void => {
        onChange(
          { target: element, currentTarget: element } as any,
          bulmaInput.items.map((item) => {
            if (regex) {
              return item as string;
            }
            return Number.isFinite(Number(item)) ? Number(item) : (item as string);
          }) as number[] | string[],
        );
      };

      bulmaInput.on('after.remove', onEvent);
      bulmaInput.on('after.add', onEvent);
      bulmaInput.on('after.flush', onEvent);

      return () => {
        bulmaInput.off('after.remove');
        bulmaInput.off('after.add');
        bulmaInput.off('after.flush');
      };
    }, [onChange, regex]);

    return (
      <div className="tags-input-container">
        <InputField ref={mergedRef} {...props} />
      </div>
    );
  },
);
