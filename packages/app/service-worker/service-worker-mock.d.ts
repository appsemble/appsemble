declare module 'service-worker-mock' {
  export default function makeServiceWorkerEnv(): makeServiceWorkerEnv.ServiceWorkerGlobalScopeMock;

  namespace makeServiceWorkerEnv {
    interface Caches {
      [key: string]: Cache;
    }

    interface Listeners {
      [type: string]: Function;
    }

    interface Snapshot {
      /**
       * A key/value map of current cache contents.
       */
      caches: Caches;
      /**
       * A list of active clients.
       */
      clients: Client[];
      /**
       * A list of active notifications.
       */
      notifications: Notification[];
    }

    interface ServiceWorkerGlobalScopeMock extends ServiceWorkerGlobalScope {
      /**
       * A key/value map of active listeners (`install`/`activate`/`fetch`/etc).
       */
      listeners: Listeners;
      /**
       * Used to trigger active listeners.
       */
      trigger(type: string): Promise<void>;
      /**
       * Used to generate a snapshot of the service worker internals.
       */
      snapshot(): Snapshot;
    }
  }
}
