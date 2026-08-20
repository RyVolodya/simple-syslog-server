declare module "ws" {
  export default class WebSocket {
    static OPEN: number;
    readyState: number;
    send(data: string): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class WebSocketServer {
    constructor(options?: any);
    handleUpgrade(req: any, socket: any, head: any, callback: (ws: WebSocket) => void): void;
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }
}
