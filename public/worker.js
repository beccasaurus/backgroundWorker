var exports = {};
importScripts('./backgroundWorker.js');
var configureWorker = exports.configureWorker;
var worker = configureWorker(function (message) { return postMessage(message, undefined); })
    .on('greeting', function () {
    console.log('Hey I guess you called "greeting"...');
})
    .onError(function (_a) {
    var errorMessage = _a.errorMessage;
    console.log("Caught My Own Error on the Worker side of things! " + errorMessage);
});
onmessage = function (e) { return worker.onmessage(e); };
onerror = function (e) { return worker.onerror(e); };
worker.send('greeting', 'Hello there from worker');
worker.send('dsfdfsdfdsfdsfsd', 'and this too');
