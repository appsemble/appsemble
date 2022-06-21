import { getAppUrl } from './getAppUrl';

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation },
    writable: true,
  });
});

afterEach(() => {
  window.location = originalLocation;
});

it('should generate an app url if no domain is present', () => {
  const result = getAppUrl('org', 'app');
  expect(result).toBe('http://app.org.localhost');
});

it('should strip port 80 if the protocol is http', () => {
  window.location.port = '80';
  const result = getAppUrl('org', 'app');
  expect(result).toBe('http://app.org.localhost');
});

it('should strip port 443 if the protocol is https', () => {
  window.location.port = '443';
  window.location.protocol = 'https:';
  const result = getAppUrl('org', 'app');
  expect(result).toBe('https://app.org.localhost');
});

it('should add the port for non-standard http ports', () => {
  window.location.port = '443';
  const result = getAppUrl('org', 'app');
  expect(result).toBe('http://app.org.localhost:443');
});

it('should add the port for non-standard https ports', () => {
  window.location.port = '80';
  window.location.protocol = 'https:';
  const result = getAppUrl('org', 'app');
  expect(result).toBe('https://app.org.localhost:80');
});

it('should prefer a domain name', () => {
  const result = getAppUrl('org', 'app', 'example.com');
  expect(result).toBe('http://example.com');
});
