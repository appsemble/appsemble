export default prefix => (string, value = true) => (string && value ? `${prefix}-${string}` : null);
