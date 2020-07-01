// class WorkerBase {

// }

/**
 * First, make it work.
 *
 * Second, extract a base class for both configureWorker (WorkerScript) and createBackgroundWorker (BackgroundWorker)
 */

export class WorkerScript {
  _postMessage: (message: any, transferable?: Transferable[]) => void;

  constructor(postMessage: (message: any, transferable?: Transferable[]) => void) {}

  // IDENTICAL WITH OTHER CLASS
  sendEvent(eventName: string, data?: any) {
    this._postMessage({
      eventName,
      data,
    });
  }

  sayHello() {
    console.log('HELLO from WorkerScript class');
  }

  onmessage(e: MessageEvent) {
    console.log('Hey from WorkerScript, I am onmessage and I got:', e);
  }

  on(params: any) {
    console.log('Ok, ok, ok we will implmenet on() hold your horses...', params);
    return this;
  }
}

export const configureWorker = (
  postMessage: (message: any, transferable?: Transferable[]) => void
) => new WorkerScript(postMessage);

// TODO add sendMessage and backgroundWorker vs worker variables
export class BackgroundWorker {
  _worker: Worker | null;

  _workerPath: string;

  _eventHandlers: Map<
    string,
    ({
      worker,
      data,
      eventName,
      event,
    }: {
      worker: BackgroundWorker;
      data: any;
      eventName: string | null;
      event: MessageEvent;
    }) => void
  >;

  _workerErrorHandler: ({
    worker,
    event,
    error,
    message,
  }: {
    worker: BackgroundWorker;
    event: ErrorEvent;
    error: Error;
    message: string;
  }) => void;

  MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY = '_messageMissingEventName';
  UNKNOWN_EVENT_HANDLER_KEY = '_unknownEvent';
  WORKER_ERROR_HANDLER_KEY = '_workerError';

  constructor({ workerPath }: BackgroundWorkerParams) {
    this._workerPath = workerPath;
    this._eventHandlers = new Map();
    this._workerErrorHandler = params => this._onWorkerError(params);
  }

  start() {
    this._worker = new Worker(this._workerPath);
    this._worker.onmessage = e => this._onMessage(e);
    this._worker.onerror = e => this._onError(e);
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

  sendEvent(eventName: string, data?: any) {
    this._postMessage({
      eventName,
      data,
    });
  }

  on(
    eventName: string,
    eventHandler: ({
      worker,
      data,
      eventName,
      event,
    }: {
      worker: BackgroundWorker;
      data: any;
      eventName: string | null;
      event: MessageEvent;
    }) => void
  ) {
    this._eventHandlers.set(eventName, eventHandler);
    return this;
  }

  onRuntimeError(
    eventHandler: ({
      worker,
      event,
      error,
      message,
    }: {
      worker: BackgroundWorker;
      event: ErrorEvent;
      error: Error;
      message: string;
    }) => void
  ) {
    this._workerErrorHandler = eventHandler;
    return this;
  }

  onMessageMissingEventName(
    eventHandler: ({
      worker,
      data,
      eventName,
      event,
    }: {
      worker: BackgroundWorker;
      data: any;
      eventName: string | null;
      event: MessageEvent;
    }) => void
  ) {
    this._eventHandlers.set(this.MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY, eventHandler);
    return this;
  }

  onUnknownEvent(
    eventHandler: ({
      worker,
      data,
      eventName,
      event,
    }: {
      worker: BackgroundWorker;
      data: any;
      eventName: string | null;
      event: MessageEvent;
    }) => void
  ) {
    this._eventHandlers.set(this.UNKNOWN_EVENT_HANDLER_KEY, eventHandler);
    return this;
  }

  _postMessage(message: any, transferable?: Transferable[]) {
    if (this._worker)
      if (transferable) this._worker.postMessage(message, transferable);
      else this._worker.postMessage(message);
  }

  _onError(e: ErrorEvent) {
    this._workerErrorHandler({ worker: this, event: e, error: e.error, message: e.message });
  }

  _onMessage(e: MessageEvent) {
    // Check for valid message (must match format: { eventName: string, data?: any })
    if (!e.data || !e.data.eventName) {
      const userMissingEventNameHandler = this._eventHandlers.get(
        this.MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY
      );
      const missingEventNameHandler = userMissingEventNameHandler
        ? userMissingEventNameHandler
        : this._onMessageMissingEventName;
      missingEventNameHandler({ worker: this, event: e, data: e.data, eventName: null });
      return;
    }

    // Check for a user-defined handler for the provided eventName
    const eventName = e.data.eventName;
    const userEventHandler = this._eventHandlers.get(eventName);

    // If the user defined a handler, call it, otherwise call the unknown event handler
    if (userEventHandler) {
      userEventHandler({ worker: this, event: e, data: e.data, eventName });
    } else {
      const userUnknownEventHandler = this._eventHandlers.get(this.UNKNOWN_EVENT_HANDLER_KEY);
      const unknownEventHandler = userUnknownEventHandler
        ? userUnknownEventHandler
        : this._onUnknownEvent;
      unknownEventHandler({ worker: this, event: e, data: e.data, eventName });
    }
  }

  // TODO use user-defined onError if defined? or even the default one? it takes a slightly different signature
  _onUnknownEvent({ eventName }: { eventName: string }) {
    console.log(`Unknown event not handled by this._worker: ${eventName}`);
    throw new Error(`Unknown event not handled by this._worker: ${eventName}`);
  }

  // TODO use user-defined onError if defined? or even the default one? it takes a slightly different signature
  _onMessageMissingEventName({ event }: { event: MessageEvent }) {
    console.log(`Provided message missing required field: eventName`, event);
    throw new Error(
      `Provided message missing required field: eventName (${JSON.stringify(event.data)})`
    );
  }

  _onWorkerError({ event }: { event: ErrorEvent }) {
    console.log('Runtime error in worker', this._workerPath, event);
    throw new Error(`Runtime error in ${this._workerPath}: ${event.message}`);
  }
}

interface BackgroundWorkerParams {
  workerPath: string;
}

export const createBackgroundWorker = (params: BackgroundWorkerParams) =>
  new BackgroundWorker(params);
