var exports: any = {};

importScripts('./backgroundWorker.js');

const { configureWorker } = exports;

const worker = configureWorker((message: any) => postMessage(message, undefined))
  .on('greeting', () => {
    console.log('Hey I guess you called "greeting"...');
  })
  .onError(({ errorMessage }: { errorMessage: string }) => {
    console.log(`Caught My Own Error on the Worker side of things! ${errorMessage}`);
  });

onmessage = e => worker.onmessage(e);
onerror = (e: ErrorEvent) => worker.onerror(e);

worker.send('greeting', 'Hello there from worker');
worker.send('dsfdfsdfdsfdsfsd', 'and this too');
