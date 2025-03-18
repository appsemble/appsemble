import { bootstrap } from '@appsemble/preact';
import { Button } from '@appsemble/preact-components';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

bootstrap(
  ({
    actions,
    events,
    parameters: { itemsPerPage, paginationType = 'limit-offset', paginatorType = 'buttons' },
    ready,
    utils: { formatMessage },
  }) => {
    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState<number>();
    const [loading, setLoading] = useState(false);
    const [tracking, setTracking] = useState(false);

    const ref = useRef();
    const observerRef = useRef<IntersectionObserver | null>(null);

    const prevPage = useCallback(() => {
      setPage((prev) => Math.max(0, prev - 1));
    }, []);

    const nextPage = useCallback(() => {
      setPage((prev) => Math.min((pageCount || 1) - 1, prev + 1));
    }, [pageCount]);

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
        events.emit.paginated(null, error as any);
      }
      setLoading(false);
    }, [actions, events.emit, itemsPerPage, page, paginationType]);

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
        return <div ref={ref} />;
      default:
        return (
          // eslint-disable-next-line react/forbid-dom-props
          <div class="mt-4 ml-auto mr-auto" style={{ width: 'fit-content' }}>
            <Button className="mr-4" disabled={loading} onClick={prevPage}>
              {formatMessage('prevLabel') || 'Prev'}
            </Button>
            <Button disabled={loading} onClick={nextPage}>
              {formatMessage('nextLabel') || 'Next'}
            </Button>
          </div>
        );
    }
  },
);
