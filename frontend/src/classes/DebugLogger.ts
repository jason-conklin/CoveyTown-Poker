/* eslint-disable no-console */

export default class DebugLogger {
  private _enabled = false;

  constructor(private _prefix: string) {}

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  prefixMessage(msg: string): string {
    return `${DebugLogger.getTimeString(new Date())} [${this._prefix}]: ${msg}`;
  }

  info(msg: string, ...params: any[]): void {
    if (this._enabled) {
      console.info(this.prefixMessage(msg), ...params);
    }
  }

  warn(msg: string, ...params: any[]): void {
    if (this._enabled) {
      console.warn(this.prefixMessage(msg), ...params);
    }
  }

  error(msg: string, ...params: any[]): void {
    console.error(this.prefixMessage(msg), ...params);
  }

  static getTimeString(time: Date): string {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const milliseconds = time.getMilliseconds().toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
}
