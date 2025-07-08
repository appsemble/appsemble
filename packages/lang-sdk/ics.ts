import { type DurationObject, type GeoCoordinates } from 'ics';
import parseDuration from 'parse-duration';

const secondLength = 1000;
const minuteLength = 60 * secondLength;
const hourLength = 60 * minuteLength;
const dayLength = 24 * hourLength;
const weekLength = 7 * dayLength;

export function getDuration(duration: number | string): DurationObject {
  let milliseconds = typeof duration === 'string' ? (parseDuration(duration) ?? 0) : duration;
  const weeks = Math.floor(milliseconds / weekLength);
  milliseconds %= weekLength;
  const days = Math.floor(milliseconds / dayLength);
  milliseconds %= dayLength;
  const hours = Math.floor(milliseconds / hourLength);
  milliseconds %= hourLength;
  const minutes = Math.floor(milliseconds / minuteLength);
  milliseconds %= minuteLength;
  const seconds = Math.floor(milliseconds / secondLength);
  return {
    weeks,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function processLocation(location: any): GeoCoordinates | undefined {
  if (typeof location !== 'object' || !location) {
    return;
  }
  const lat = location.latitude ?? location.lat ?? location[0];
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return;
  }
  let lon = location.longitude ?? location.lon ?? location.lng ?? location[1];
  if (typeof lon !== 'number' || !Number.isFinite(lon)) {
    return;
  }
  lon = (((lon % 360) + 540) % 360) - 180;
  return { lat, lon };
}
