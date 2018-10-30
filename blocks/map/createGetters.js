import { compileFilters } from '@appsemble/utils/remap';

export default function createGetters(params) {
  return {
    lat: params.latitude == null ? data => data.latitude : compileFilters(params.latitude),
    lng: params.longitude == null ? data => data.longitude : compileFilters(params.longitude),
  };
}
