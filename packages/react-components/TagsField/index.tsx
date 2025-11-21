import { type NamedEvent } from '@appsemble/web-utils';
import BulmaTagsInput, { type BulmaTagsInputOptions } from '@creativebulma/bulma-tagsinput';
import '@creativebulma/bulma-tagsinput/dist/css/bulma-tagsinput.css';
import { type ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from 'react';

import { InputField, useCombinedRefs } from '../index.js';

type TagsFieldProps = Omit<ComponentPropsWithoutRef<typeof InputField>, 'onChange' | 'value'> &
  Pick<BulmaTagsInputOptions, 'delimiter'> & {
    readonly onChange: (event: NamedEvent<HTMLInputElement>, value: string[]) => void;

    readonly value?: string[];
  };

export const TagsField = forwardRef<HTMLInputElement, TagsFieldProps>(
  ({ delimiter, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>();
    const bulmaInputRef = useRef<BulmaTagsInput>();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const mergedRef = useCombinedRefs(innerRef, ref);

    useEffect(() => {
      const element = innerRef.current;
      if (!element) {
        return;
      }
      bulmaInputRef.current = new BulmaTagsInput(element, { delimiter });
      // Bulma tags input can’t be updated. Don’t support updating the delimiter on the fly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const element = innerRef.current;
      const bulmaInput = bulmaInputRef.current;
      if (!bulmaInput) {
        return;
      }

      const onEvent = (): void =>
        onChange({ target: element, currentTarget: element } as any, bulmaInput.items as string[]);
      bulmaInput.on('after.remove', onEvent);
      bulmaInput.on('after.add', onEvent);
      bulmaInput.on('after.flush', onEvent);

      return () => {
        bulmaInput.off('after.remove');
        bulmaInput.off('after.add');
        bulmaInput.off('after.flush');
      };
    }, [onChange]);

    return <InputField ref={mergedRef} {...props} />;
  },
);
