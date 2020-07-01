# 🛠 Background Workers

Communication with `new Worker('./worker.js')` can be a pain.

Everyone has some kind of a solution for using Web Workers.

This is mine.

---

From your application:

```ts
import { createBackgroundWorker } from '../public/backgroundWorkers'

const worker = createBackgroundWorker('./worker.js')'

worker.on('fetchedItems', ({ data: items }) => {
  console.log('Sweet, the worker finished getting the items!', items);
  worker.terminate()
})

worker.send('startFetchingItems');

worker.start();
```

From your worker script:

```ts
var exports: any = {};

importScripts('./backgroundWorkers');

const { configureWorker } = exports;

const worker = configureWorker(postMessage);

worker.on('startFetchingItems', async ({ reply }) => {
  console.log('Aw, jeez, I guess I should start fetching items now...');

  // ...
  const items = await longRunningThings();
  // ...

  reply('fetchedItems', items);
});

worker.send('workerStarted');
```
