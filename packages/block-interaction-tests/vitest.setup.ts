class IntersectionObserverMock {
  constructor() {}

  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

(global as any).IntersectionObserver = IntersectionObserverMock;
