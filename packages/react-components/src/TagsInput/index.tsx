import '@creativebulma/bulma-tagsinput/dist/css/bulma-tagsinput.css';

import BulmaTagsInput, { BulmaTagsInputOptions } from '@creativebulma/bulma-tagsinput';
import * as React from 'react';

import Input from '../Input';

type TagsInputProps = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange' | 'value'> &
  Pick<BulmaTagsInputOptions, 'delimiter'> & {
    onChange(event: Event, value: string[]): void;

    value?: string[];
  };

export default React.forwardRef<HTMLInputElement, TagsInputProps>(
  ({ delimiter, onChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>();

    const mergedRef = React.useCallback(
      (input) => {
        if (ref instanceof Function) {
          ref(input);
        } else if ('current' in ref) {
          // eslint-disable-next-line no-param-reassign
          ref.current = input;
        }
        innerRef.current = input;
      },
      [ref],
    );

    React.useEffect(() => {
      const element = innerRef.current;
      const bulmaInput = new BulmaTagsInput(element, { delimiter });
      const onEvent = (): void => {
        onChange({ target: element, currentTarget: element } as any, bulmaInput.items as string[]);
      };
      bulmaInput.on('after.remove', onEvent);
      bulmaInput.on('after.add', onEvent);
      bulmaInput.on('after.flush', onEvent);

      return () => {
        bulmaInput.off('after.remove');
        bulmaInput.off('after.add');
        bulmaInput.off('after.flush');
      };
      // It works now, but if we add dependencies to the dependency array, the behaviour is a but
      // funky.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Input ref={mergedRef} onChange={null} {...props} />;
  },
);
