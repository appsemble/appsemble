import {
  Children,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { Button, Form, FormButtons } from '../index.js';

const Context = createContext<StepperProps>({
  children: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onFinish() {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onCancel() {},
});

interface StepperProps {
  readonly children: ReactNode;
  readonly onFinish: () => void;
  readonly onCancel: () => void;
}

export function Stepper({ children, onCancel, onFinish }: StepperProps): ReactNode {
  const [step, setStep] = useState(0);
  const childArray = Children.toArray(children);

  const back = useCallback(() => {
    if (step === 0) {
      onCancel();
    } else {
      setStep(step - 1);
    }
  }, [step, onCancel]);

  const next = useCallback(() => {
    if (step >= childArray.length - 1) {
      onFinish();
    } else {
      setStep(step + 1);
    }
  }, [step, onFinish, childArray]);

  const context = useMemo(() => ({ children, onFinish, onCancel }), [onFinish, onCancel, children]);

  return (
    <Form onSubmit={next}>
      <Context.Provider value={context}>{childArray[step]}</Context.Provider>
      <FormButtons className="mt-1 mb-1">
        <Button onClick={back}>
          {step === 0 ? (
            <FormattedMessage {...messages.cancel} />
          ) : (
            <FormattedMessage {...messages.back} />
          )}
        </Button>
        <Button type="submit">
          {step === childArray.length - 1 ? (
            <FormattedMessage {...messages.finish} />
          ) : (
            <FormattedMessage {...messages.next} />
          )}
        </Button>
      </FormButtons>
    </Form>
  );
}

export function useStepper(): StepperProps {
  return useContext(Context);
}
