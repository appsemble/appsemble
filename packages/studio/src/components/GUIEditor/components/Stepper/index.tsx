import { Button, Form, FormButtons } from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

const Context = React.createContext<StepperProps>(null);

interface StepperProps {
  children: React.ReactElement[];
  onFinish: () => void;
  onCancel: () => void;
}

export default function Stepper({
  children,
  onCancel,
  onFinish,
}: StepperProps): React.ReactElement {
  const [step, setStep] = React.useState(0);
  const [value, setValue] = React.useState({});
  const childArray = React.Children.toArray(children);

  const back = React.useCallback(() => {
    if (step === 0) {
      onCancel();
    } else {
      setStep(step - 1);
    }
  }, [step, onCancel]);

  const next = React.useCallback(() => {
    if (step >= children.length - 1) {
      onFinish();
    } else {
      setStep(step + 1);
    }
  }, [children, step, onFinish]);

  const context = React.useMemo(() => ({ children, value, onFinish, onCancel }), [
    value,
    onFinish,
    onCancel,
    children,
  ]);

  return (
    <Form onSubmit={next}>
      <Context.Provider value={context}>{childArray[step]}</Context.Provider>
      <FormButtons>
        <Button onClick={back}>
          {step === 0 ? (
            <FormattedMessage {...messages.cancel} />
          ) : (
            <FormattedMessage {...messages.back} />
          )}
        </Button>
        <Button type="submit">
          {step === children.length - 1 ? (
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
  return React.useContext(Context);
}
