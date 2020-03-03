export {};

declare module '@appsemble/sdk' {
  interface Parameters {
    latitude: string;
    longitude: string;
    disableClustering?: boolean;

    /**
     * The maximum radius that a cluster will cover from the central marker (in pixels). Default 80.
     * Decreasing will make more, smaller clusters.
     * You can also use a function that accepts the current map zoom
     * and returns the maximum cluster radius in pixels.
     *
     * @minimum 1
     * @TJS-type integer
     */
    maxClusterRadius?: number;
  }

  interface Actions {
    onMarkerClick: {};
  }

  interface EventListeners {
    data: {};
  }

  interface EventEmitters {
    move: {};
  }
}
