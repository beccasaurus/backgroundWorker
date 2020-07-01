"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.createBackgroundWorker = exports.BackgroundWorker = exports.configureWorker = exports.WorkerScript = void 0;
/**
 * Both the App-side createBackgroundWorker() and the Worker-side configureWorker()
 * include functionality to register message handlers as well as sending messages.
 * This base class contains everything not specific to either the App-side or Worker-side.
 */
var WorkerBase = /** @class */ (function () {
    function WorkerBase() {
        var _this = this;
        this._messageHandlers = new Map();
        this._onErrorHandler = function (params) { return _this._defaultErrorHandler(params); };
        this._unknownEventHandler = function (params) { return _this._defaultUnknownEventHandler(params); };
        this._defaultInvalidMessageHandler = function (params) { return _this._defaultInvalidMessageHandler(params); };
    }
    WorkerBase.prototype.send = function (eventName, data) { };
    WorkerBase.prototype.on = function (eventName, handler) {
        this._messageHandlers.set(eventName, handler);
        return this;
    };
    WorkerBase.prototype.onError = function (handler) {
        this._onErrorHandler = handler;
        return this;
    };
    WorkerBase.prototype.onUnknownEvent = function (handler) {
        this._unknownEventHandler = handler;
        return this;
    };
    WorkerBase.prototype.onInvalidMessage = function (handler) {
        this._invalidMessageHandler = handler;
        return this;
    };
    WorkerBase.prototype.onMessage = function (handler) {
        this._viewEveryMessageHandler = handler;
        return this;
    };
    WorkerBase.prototype.onmessage = function (e) {
        var _a;
        var eventName = (_a = e.data) === null || _a === void 0 ? void 0 : _a.eventName;
        var messageParams = {
            eventName: eventName,
            messageEvent: e,
            data: e.data,
            reply: this.send
        };
        if (this._viewEveryMessageHandler)
            this._viewEveryMessageHandler(messageParams);
        if (!eventName) {
            this._invalidMessageHandler(messageParams);
            return;
        }
        var eventHandler = this._messageHandlers.get(eventName);
        if (!eventHandler) {
            this._unknownEventHandler(messageParams);
            return;
        }
        eventHandler(messageParams);
    };
    WorkerBase.prototype.onerror = function (e) {
        var errorParams = {
            error: e.error,
            errorMessage: e.message,
            reply: this.send
        };
        this._onErrorHandler(errorParams);
    };
    WorkerBase.prototype._defaultErrorHandler = function (_a) {
        var error = _a.error, errorMessage = _a.errorMessage, eventName = _a.eventName, messageEvent = _a.messageEvent;
        console.log("Worker error: " + errorMessage);
    };
    WorkerBase.prototype._defaultUnknownEventHandler = function (_a) {
        var eventName = _a.eventName, messageEvent = _a.messageEvent, data = _a.data, reply = _a.reply;
        var errorMessage = "Worker received unhandled event type: " + eventName;
        console.log(errorMessage, data);
        this._onErrorHandler({
            error: new Error(errorMessage),
            errorMessage: errorMessage,
            eventName: eventName,
            data: data,
            messageEvent: messageEvent,
            reply: reply
        });
    };
    WorkerBase.prototype._defaultInvalidMessageHandler = function (_a) {
        var messageEvent = _a.messageEvent, data = _a.data, reply = _a.reply;
        var errorMessage = "Worker received invalid message without declared eventType: " + JSON.stringify(data);
        console.log(errorMessage, data);
        this._onErrorHandler({
            error: new Error(errorMessage),
            errorMessage: errorMessage,
            data: data,
            messageEvent: messageEvent,
            reply: reply
        });
    };
    return WorkerBase;
}());
/**
 * Contains everything specific to configureWorker()
 */
var WorkerScript = /** @class */ (function (_super) {
    __extends(WorkerScript, _super);
    function WorkerScript(postMessageFunction) {
        var _this = _super.call(this) || this;
        _this._postMessageFunction = postMessageFunction;
        return _this;
    }
    WorkerScript.prototype.send = function (eventName, data) {
        this._postMessageFunction({
            eventName: eventName,
            data: data
        });
    };
    return WorkerScript;
}(WorkerBase));
exports.WorkerScript = WorkerScript;
exports.configureWorker = function (postMessageFunction) { return new WorkerScript(postMessageFunction); };
/**
 * Contains everything specific to createBackgroundWorker()
 */
var BackgroundWorker = /** @class */ (function (_super) {
    __extends(BackgroundWorker, _super);
    function BackgroundWorker(workerPath) {
        var _this = _super.call(this) || this;
        _this._workerPath = workerPath;
        return _this;
    }
    BackgroundWorker.prototype.send = function (eventName, data) {
        if (this._worker)
            this._worker.postMessage({
                eventName: eventName,
                data: data
            });
    };
    BackgroundWorker.prototype.start = function () {
        var _this = this;
        this._worker = new Worker(this._workerPath);
        this._worker.onmessage = function (e) { return _this.onmessage(e); };
        this._worker.onerror = function (e) { return _this.onerror(e); };
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
    return BackgroundWorker;
}(WorkerBase));
exports.BackgroundWorker = BackgroundWorker;
exports.createBackgroundWorker = function (workerPath) { return new BackgroundWorker(workerPath); };
