import { bootstrap } from '@appsemble/preact';
import { type OpenAIResponse } from '@appsemble/sdk';
import { useEffect, useState } from 'preact/hooks';

import { ModelGPT } from './components/gpt/index.tsx';
import styles from './index.module.css';

bootstrap(({ events, ready }) => {
  const [data, setData] = useState<OpenAIResponse | null>(null);

  useEffect(() => {
    ready();
  }, [ready]);

  events.on.response((response: OpenAIResponse) => {
    setData(response);
  });

  return (
    <div className={styles.root}>
      <ModelGPT data={data} />
    </div>
  );
});
