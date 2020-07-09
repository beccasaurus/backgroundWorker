# 🛠 Background Workers

Communication with `new Worker('./worker.js')` can be a pain.

Everyone has some kind of a solution for using Web Workers.

This is mine.

---

From your application:

```ts
import { createBackgroundWorker } from '../public/backgroundWorker'

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
importScripts('./backgroundWorker');

const worker = exports.configureWorker((message: any) => postMessage(message, undefined));

worker.on('startFetchingItems', async ({ reply }) => {
  console.log('Aw, jeez, I guess I should start fetching items now...');

  // ...
  const items = await longRunningThings();
  // ...

  reply('fetchedItems', items);
});

onmessage = e => worker.onmessage(e);
onerror = (e: ErrorEvent) => worker.onerror(e);

worker.send('workerStarted');
```

---

To make it work, put `backgroundWorkers.js` into your `public/` where you can import it from your `worker.js` and put `backgroundWorkers.ts` wherever you like.

I might find a way to package this, but for now, just copy/paste 🧐

Hey, it works for me 🤷🏼‍♀️ You do you!
