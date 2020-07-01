interface MessageHandlerParams {
  eventName?: string;
  messageEvent: MessageEvent;
  data: any;
  reply: (eventName: string, data: any) => void;
}

type MessageHandler = (params: MessageHandlerParams) => void;

interface ErrorHandlerParams {
  error: Error;
  errorMessage: string;
  eventName?: string;
  messageEvent?: MessageEvent;
  data?: any;
  reply?: (eventName: string, data: any) => void;
}

type ErrorHandler = (params: ErrorHandlerParams) => void;

/**
 * Both the App-side createBackgroundWorker() and the Worker-side configureWorker()
 * include functionality to register message handlers as well as sending messages.
 * This base class contains everything not specific to either the App-side or Worker-side.
 */
class WorkerBase {
  _messageHandlers: Map<string, MessageHandler>;
  _onErrorHandler: ErrorHandler;
  _unknownEventHandler: MessageHandler;
  _invalidMessageHandler: MessageHandler;
  _viewEveryMessageHandler: MessageHandler;

  constructor() {
    this._messageHandlers = new Map();
    this._onErrorHandler = params => this._defaultErrorHandler(params);
    this._unknownEventHandler = params => this._defaultUnknownEventHandler(params);
    this._defaultInvalidMessageHandler = params => this._defaultInvalidMessageHandler(params);
  }

  send(eventName: string, data?: any) {}

  on(eventName: string, handler: MessageHandler) {
    this._messageHandlers.set(eventName, handler);
    return this;
  }

  onError(handler: ErrorHandler) {
    this._onErrorHandler = handler;
    return this;
  }

  onUnknownEvent(handler: MessageHandler) {
    this._unknownEventHandler = handler;
    return this;
  }

  onInvalidMessage(handler: MessageHandler) {
    this._invalidMessageHandler = handler;
    return this;
  }

  onMessage(handler: MessageHandler) {
    this._viewEveryMessageHandler = handler;
    return this;
  }

  onmessage(e: MessageEvent) {
    const eventName = e.data?.eventName;
    const payload = e.data?.data;

    const messageParams: MessageHandlerParams = {
      eventName,
      messageEvent: e,
      data: payload,
      reply: this.send,
    };

    if (this._viewEveryMessageHandler) this._viewEveryMessageHandler(messageParams);

    if (!eventName) {
      this._invalidMessageHandler(messageParams);
      return;
    }

    const eventHandler = this._messageHandlers.get(eventName);
    if (!eventHandler) {
      this._unknownEventHandler(messageParams);
      return;
    }

    eventHandler(messageParams);
  }

  onerror(e: ErrorEvent) {
    const errorParams: ErrorHandlerParams = {
      error: e.error,
      errorMessage: e.message,
      reply: this.send,
    };

    this._onErrorHandler(errorParams);
  }

  _defaultErrorHandler({ error, errorMessage, eventName, messageEvent }: ErrorHandlerParams) {
    console.log(`Worker error: ${errorMessage}`);
  }

  _defaultUnknownEventHandler({ eventName, messageEvent, data, reply }: MessageHandlerParams) {
    const errorMessage = `Worker received unhandled event type: ${eventName}`;
    console.log(errorMessage, data);
    this._onErrorHandler({
      error: new Error(errorMessage),
      errorMessage,
      eventName,
      data,
      messageEvent,
      reply,
    });
  }

  _defaultInvalidMessageHandler({ messageEvent, data, reply }: MessageHandlerParams) {
    const errorMessage = `Worker received invalid message without declared eventType: ${JSON.stringify(
      data
    )}`;
    console.log(errorMessage, data);
    this._onErrorHandler({
      error: new Error(errorMessage),
      errorMessage,
      data,
      messageEvent,
      reply,
    });
  }
}

/**
 * Contains everything specific to configureWorker()
 */
export class WorkerScript extends WorkerBase {
  _postMessageFunction: (message: any, transferable?: Transferable[]) => void;

  constructor(postMessageFunction: (message: any, transferable?: Transferable[]) => void) {
    super();
    this._postMessageFunction = postMessageFunction;
  }

  send(eventName: string, data?: any) {
    this._postMessageFunction({
      eventName,
      data,
    });
  }
}

export const configureWorker = (
  postMessageFunction: (message: any, transferable?: Transferable[]) => void
) => new WorkerScript(postMessageFunction);

/**
 * Contains everything specific to createBackgroundWorker()
 */
export class BackgroundWorker extends WorkerBase {
  _worker: Worker | null;
  _workerPath: string;

  constructor(workerPath: string) {
    super();
    this._workerPath = workerPath;
  }

  send(eventName: string, data?: any) {
    if (this._worker)
      this._worker.postMessage({
        eventName,
        data,
      });
  }

  start() {
    this._worker = new Worker(this._workerPath);
    this._worker.onmessage = e => this.onmessage(e);
    this._worker.onerror = e => this.onerror(e);
    return this;
  }

  running() {
    return !!this._worker;
  }

  terminate() {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    return this;
  }
}

export const createBackgroundWorker = (workerPath: string) => new BackgroundWorker(workerPath);
