interface FetchEvent extends Event {
  request: Request;

  respondWith: (promise: Promise<any>) => void;
}
