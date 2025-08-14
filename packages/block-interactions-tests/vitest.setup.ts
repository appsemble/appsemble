class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as any).IntersectionObserver = IntersectionObserverMock;
