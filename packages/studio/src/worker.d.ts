declare module '*.worker' {
  export default class WebpackWorker extends Worker {
    constructor();
  }
}
