"use strict";
// class WorkerBase {
exports.__esModule = true;
exports.createBackgroundWorker = exports.BackgroundWorker = exports.configureWorker = exports.WorkerScript = void 0;
// }
/**
 * First, make it work.
 *
 * Second, extract a base class for both configureWorker (WorkerScript) and createBackgroundWorker (BackgroundWorker)
 */
var WorkerScript = /** @class */ (function () {
    function WorkerScript(postMessage) {
    }
    // IDENTICAL WITH OTHER CLASS
    WorkerScript.prototype.sendEvent = function (eventName, data) {
        this._postMessage({
            eventName: eventName,
            data: data
        });
    };
    WorkerScript.prototype.sayHello = function () {
        console.log('HELLO from WorkerScript class');
    };
    WorkerScript.prototype.onmessage = function (e) {
        console.log('Hey from WorkerScript, I am onmessage and I got:', e);
    };
    WorkerScript.prototype.on = function (params) {
        console.log('Ok, ok, ok we will implmenet on() hold your horses...', params);
        return this;
    };
    return WorkerScript;
}());
exports.WorkerScript = WorkerScript;
exports.configureWorker = function (postMessage) { return new WorkerScript(postMessage); };
// TODO add sendMessage and backgroundWorker vs worker variables
var BackgroundWorker = /** @class */ (function () {
    function BackgroundWorker(_a) {
        var _this = this;
        var workerPath = _a.workerPath;
        this.MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY = '_messageMissingEventName';
        this.UNKNOWN_EVENT_HANDLER_KEY = '_unknownEvent';
        this.WORKER_ERROR_HANDLER_KEY = '_workerError';
        this._workerPath = workerPath;
        this._eventHandlers = new Map();
        this._workerErrorHandler = function (params) { return _this._onWorkerError(params); };
    }
    BackgroundWorker.prototype.start = function () {
        var _this = this;
        this._worker = new Worker(this._workerPath);
        this._worker.onmessage = function (e) { return _this._onMessage(e); };
        this._worker.onerror = function (e) { return _this._onError(e); };
        return this;
    };
    BackgroundWorker.prototype.running = function () {
        return !!this._worker;
    };
    BackgroundWorker.prototype.terminate = function () {
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        return this;
    };
    BackgroundWorker.prototype.sendEvent = function (eventName, data) {
        this._postMessage({
            eventName: eventName,
            data: data
        });
    };
    BackgroundWorker.prototype.on = function (eventName, eventHandler) {
        this._eventHandlers.set(eventName, eventHandler);
        return this;
    };
    BackgroundWorker.prototype.onRuntimeError = function (eventHandler) {
        this._workerErrorHandler = eventHandler;
        return this;
    };
    BackgroundWorker.prototype.onMessageMissingEventName = function (eventHandler) {
        this._eventHandlers.set(this.MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY, eventHandler);
        return this;
    };
    BackgroundWorker.prototype.onUnknownEvent = function (eventHandler) {
        this._eventHandlers.set(this.UNKNOWN_EVENT_HANDLER_KEY, eventHandler);
        return this;
    };
    BackgroundWorker.prototype._postMessage = function (message, transferable) {
        if (this._worker)
            if (transferable)
                this._worker.postMessage(message, transferable);
            else
                this._worker.postMessage(message);
    };
    BackgroundWorker.prototype._onError = function (e) {
        this._workerErrorHandler({ worker: this, event: e, error: e.error, message: e.message });
    };
    BackgroundWorker.prototype._onMessage = function (e) {
        // Check for valid message (must match format: { eventName: string, data?: any })
        if (!e.data || !e.data.eventName) {
            var userMissingEventNameHandler = this._eventHandlers.get(this.MESSAGE_MISSING_EVENT_NAME_HANDLER_KEY);
            var missingEventNameHandler = userMissingEventNameHandler
                ? userMissingEventNameHandler
                : this._onMessageMissingEventName;
            missingEventNameHandler({ worker: this, event: e, data: e.data, eventName: null });
            return;
        }
        // Check for a user-defined handler for the provided eventName
        var eventName = e.data.eventName;
        var userEventHandler = this._eventHandlers.get(eventName);
        // If the user defined a handler, call it, otherwise call the unknown event handler
        if (userEventHandler) {
            userEventHandler({ worker: this, event: e, data: e.data, eventName: eventName });
        }
        else {
            var userUnknownEventHandler = this._eventHandlers.get(this.UNKNOWN_EVENT_HANDLER_KEY);
            var unknownEventHandler = userUnknownEventHandler
                ? userUnknownEventHandler
                : this._onUnknownEvent;
            unknownEventHandler({ worker: this, event: e, data: e.data, eventName: eventName });
        }
    };
    // TODO use user-defined onError if defined? or even the default one? it takes a slightly different signature
    BackgroundWorker.prototype._onUnknownEvent = function (_a) {
        var eventName = _a.eventName;
        console.log("Unknown event not handled by this._worker: " + eventName);
        throw new Error("Unknown event not handled by this._worker: " + eventName);
    };
    // TODO use user-defined onError if defined? or even the default one? it takes a slightly different signature
    BackgroundWorker.prototype._onMessageMissingEventName = function (_a) {
        var event = _a.event;
        console.log("Provided message missing required field: eventName", event);
        throw new Error("Provided message missing required field: eventName (" + JSON.stringify(event.data) + ")");
    };
    BackgroundWorker.prototype._onWorkerError = function (_a) {
        var event = _a.event;
        console.log('Runtime error in worker', this._workerPath, event);
        throw new Error("Runtime error in " + this._workerPath + ": " + event.message);
    };
    return BackgroundWorker;
}());
exports.BackgroundWorker = BackgroundWorker;
exports.createBackgroundWorker = function (params) {
    return new BackgroundWorker(params);
};
