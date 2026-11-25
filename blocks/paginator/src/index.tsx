import { bootstrap } from '@appsemble/preact';
import { Button } from '@appsemble/preact-components';
import { type MutableRef, useCallback, useEffect, useRef, useState } from 'preact/hooks';

bootstrap(
  ({
    actions,
    events,
    parameters: { itemsPerPage, paginationType = 'limit-offset', paginatorType = 'buttons' },
    ready,
    utils: { formatMessage, isActionOwnerAbortError },
  }) => {
    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState<number>();
    const [loading, setLoading] = useState(false);
    const [tracking, setTracking] = useState(false);

    const ref = useRef<HTMLDivElement>();
    const observerRef = useRef<IntersectionObserver | null>(null);

    const prevPage = useCallback(() => {
      setPage((prev) => Math.max(0, prev - 1));
    }, []);

    const lastPage = (pageCount || 1) - 1;

    const nextPage = useCallback(() => {
      setPage((prev) => Math.min(lastPage, prev + 1));
    }, [lastPage]);

    useEffect(() => {
      if (paginatorType !== 'scroll') {
        return;
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && tracking) {
              nextPage();
              observerRef.current?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.1 },
      );

      setTimeout(() => {
        if (ref.current) {
          observerRef.current?.observe(ref.current);
        }
        // Delays execution slightly to ensure DOM update
      }, 100);

      return () => observerRef.current?.disconnect();
    }, [page, loading, paginatorType, nextPage, tracking]);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        let paginationObject;
        switch (paginationType) {
          default:
            paginationObject = { $skip: page * itemsPerPage, $top: itemsPerPage };
        }

        const data = await actions.onLoad(paginationObject);
        events.emit.paginated(data);
      } catch (error: unknown) {
        // The block was unmounted mid-load, e.g. by switching tabs. The load was cancelled, not
        // failed, so there is nothing to report.
        if (!isActionOwnerAbortError(error)) {
          events.emit.paginated(null, error as any);
        }
      }
      setLoading(false);
    }, [actions, events.emit, isActionOwnerAbortError, itemsPerPage, page, paginationType]);

    useEffect(() => {
      fetchData();
    }, [fetchData, page]);

    useEffect(ready, [ready]);

    useEffect(() => {
      const callback = (): void => {
        setPage(0);
        setTracking(false);
      };
      events.on.reset(callback);
      return () => events.off.reset(callback);
    }, [events]);

    useEffect(() => {
      const callback = (data: unknown): void =>
        setPageCount(Math.ceil((Number(data) || 1) / itemsPerPage));
      events.on.itemsCountChange(callback);
      return () => events.off.itemsCountChange(callback);
    }, [events, itemsPerPage]);

    useEffect(() => {
      const callback = (): void => setTracking(true);
      events.on.toggleTracking(callback);
      return () => events.off.toggleTracking(callback);
    }, [events, tracking]);

    switch (paginatorType) {
      case 'scroll':
        return <div ref={(ref as MutableRef<HTMLDivElement>) || undefined} />;
      default:
        return (
          <nav
            aria-label={formatMessage('navigationLabel')}
            class="mt-4 ml-auto mr-auto"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ width: 'fit-content' }}
          >
            <Button className="mr-4" disabled={loading || page === 0} onClick={prevPage}>
              {formatMessage('prevLabel')}
            </Button>
            {pageCount === undefined ? null : (
              <span aria-live="polite" className="mr-4">
                {formatMessage('pageLabel', { page: page + 1, pageCount })}
              </span>
            )}
            <Button disabled={loading || page >= lastPage} onClick={nextPage}>
              {formatMessage('nextLabel')}
            </Button>
          </nav>
        );
    }
  },
);
