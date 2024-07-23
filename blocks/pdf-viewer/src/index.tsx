import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';

bootstrap(({ actions, events, pageParameters, parameters: { height, width }, ready }) => {
  const [fileSrc, setFileSrc] = useState<string>('');
  const [error, setError] = useState(false);

  function createBlobUrl(data: any): void {
    if (data instanceof Blob) {
      const blobUrl = URL.createObjectURL(data);
      setFileSrc(blobUrl);
      setError(false);
    }
  }

  useEffect(() => {
    ready();
  }, [ready]);

  useEffect(() => {
    async function loadData(d?: Record<string, unknown>): Promise<void> {
      try {
        const result = await actions.onLoad({ ...pageParameters, ...d });
        createBlobUrl(result);
      } catch {
        setError(true);
        setFileSrc('');
      }
    }
    loadData();
  }, [actions]);

  useEffect(() => {
    const onData = (newData: any, newError: unknown): void => {
      if (newError) {
        setError(true);
        setFileSrc('');
      } else {
        createBlobUrl(newData);
      }
    };

    events.on.data(onData);

    return () => {
      events.off.data(onData);
    };
  }, [events, fileSrc]);

  if (error) {
    return (
      <p>
        <FormattedMessage id="error" />
      </p>
    );
  }

  return (
    <div className="container is-fluid">
      <object data={fileSrc} height={height || 600} type="application/pdf" width={width || 850}>
        <FormattedMessage id="error" />
      </object>
    </div>
  );
});
