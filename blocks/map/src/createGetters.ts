import { compileFilters } from '@appsemble/utils';

export interface LatLngMapper {
  lat: (data: any) => any;
  lng: (data: any) => any;
}

export interface BlockParameters {
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

export interface BlockActions {
  onMarkerClick: {};
}

export interface Events {
  listen: 'data';
  emit: 'move';
}

export default function createGetters(params: BlockParameters): LatLngMapper {
  return {
    lat:
      params.latitude == null
        ? data => data.latitude
        : compileFilters(params.latitude, { intl: null }),
    lng:
      params.longitude == null
        ? data => data.longitude
        : compileFilters(params.longitude, { intl: null }),
  };
}
