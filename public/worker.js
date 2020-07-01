console.log('Hi from worker! Someone started me :)');
// onmessage = (e: MessageEvent) => {
//   console.log('Hi from the worker, I just got a message!', JSON.stringify(e.data));
//   postMessage({ eventName: 'reply', data: 'Hi this is my reply' }, undefined);
//   postMessage('I have no event name', undefined);
// };
var exports = {};
importScripts('./backgroundWorker.js');
var configureWorker = exports.configureWorker;
var worker = configureWorker(postMessage).on('greeting', function () {
    // reply(
    //   'greeting',
    //   `Well, hello back! I am the worker and I'm here to say: I got your message: ${JSON.stringify(
    //     data
    //   )}`
    // );
    console.log('Hey I guess you called "greeting"...');
});
onmessage = worker.onmessage;
