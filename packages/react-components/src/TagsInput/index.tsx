import '@creativebulma/bulma-tagsinput/dist/css/bulma-tagsinput.css';

import type { NamedEvent } from '@appsemble/web-utils';
import BulmaTagsInput, { BulmaTagsInputOptions } from '@creativebulma/bulma-tagsinput';
import React, { ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from 'react';

import Input from '../Input';
import useCombinedRefs from '../useCombinedRefs';

type TagsInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'onChange' | 'value'> &
  Pick<BulmaTagsInputOptions, 'delimiter'> & {
    onChange(event: NamedEvent<HTMLInputElement>, value: string[]): void;

    value?: string[];
  };

export default forwardRef<HTMLInputElement, TagsInputProps>(
  ({ delimiter, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>();
    const bulmaInputRef = useRef<BulmaTagsInput>();

    const mergedRef = useCombinedRefs(innerRef, ref);

    useEffect(() => {
      const element = innerRef.current;
      bulmaInputRef.current = new BulmaTagsInput(element, { delimiter });
      // Bulma tags input can’t be updated. Don’t support updating the delimiter on the fly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const element = innerRef.current;
      const bulmaInput = bulmaInputRef.current;
      if (!bulmaInput) {
        return undefined;
      }

      const onEvent = (): void =>
        onChange({ target: element, currentTarget: element }, bulmaInput.items as string[]);
      bulmaInput.on('after.remove', onEvent);
      bulmaInput.on('after.add', onEvent);
      bulmaInput.on('after.flush', onEvent);

      return () => {
        bulmaInput.off('after.remove');
        bulmaInput.off('after.add');
        bulmaInput.off('after.flush');
      };
    }, [onChange]);

    return <Input ref={mergedRef} onChange={null} {...props} />;
  },
);
