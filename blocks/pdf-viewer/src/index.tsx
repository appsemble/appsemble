import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';

bootstrap(
  ({ actions, data, events, pageParameters, parameters: { height, url, width }, ready, utils }) => {
    const [fileSrc, setFileSrc] = useState<string>('');
    const [error, setError] = useState(false);

    function createBlobUrl(src: any): void {
      if (src instanceof Blob) {
        const blobUrl = URL.createObjectURL(src);
        setFileSrc(blobUrl);
        setError(false);
      }
    }

    useEffect(() => {
      ready();
    }, [ready]);

    useEffect(() => {
      if (!url) {
        return;
      }
      const controller = new AbortController();

      async function loadUrl(): Promise<void> {
        try {
          const remappedUrl = utils.remap(url, data);
          if (typeof remappedUrl !== 'string' || !remappedUrl) {
            setError(true);
            setFileSrc('');
            return;
          }
          const assetUrl = /^(https?:)?\/\//.test(remappedUrl)
            ? remappedUrl
            : utils.asset(remappedUrl);
          const response = await fetch(assetUrl, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Failed to load PDF: ${response.status}`);
          }
          createBlobUrl(await response.blob());
        } catch (caughtError) {
          if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
            return;
          }
          setError(true);
          setFileSrc('');
        }
      }

      loadUrl();
      return () => {
        controller.abort();
      };
    }, [data, url, utils]);

    useEffect(() => {
      // The url parameter is the sole source when set; the onLoad action is skipped so the two
      // sources cannot overwrite each other.
      if (url) {
        return;
      }

      async function loadData(d?: Record<string, unknown>): Promise<void> {
        try {
          const result = await actions.onLoad({ ...pageParameters, ...d });
          createBlobUrl(result);
        } catch (caughtError) {
          // The block was unmounted mid-load, e.g. by switching tabs. The load was cancelled, not
          // failed, so there is nothing to report.
          if (utils.isActionOwnerAbortError(caughtError)) {
            return;
          }
          setError(true);
          setFileSrc('');
        }
      }
      loadData();
    }, [actions, data, pageParameters, url, utils]);

    useEffect(
      () => () => {
        if (fileSrc) {
          URL.revokeObjectURL(fileSrc);
        }
      },
      [fileSrc],
    );

    useEffect(() => {
      // When url is set it is the sole source, so incoming data events are ignored to avoid
      // overwriting the url-loaded PDF.
      if (url) {
        return;
      }

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
    }, [events, url]);

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
  },
);
