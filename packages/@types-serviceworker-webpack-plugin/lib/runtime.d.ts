// eslint-disable-next-line filenames/match-exported
declare interface Runtime {
  register(): Promise<ServiceWorkerRegistration>;
}

declare const runtime: Runtime;

export default runtime;
