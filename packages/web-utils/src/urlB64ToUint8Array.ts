export default function urlB64ToUint8Array(base64String: string): Uint8Array {
  const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
