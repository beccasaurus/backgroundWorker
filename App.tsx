import * as React from 'react';

import { createBackgroundWorker } from './public/backgroundWorker';

const appState = {
  workerRunning: false,
};

const myWorker = createBackgroundWorker('./worker.js')
  .on('greeting', ({ data }) => {
    console.log('The background worker replied with this:', data);
  })
  .onError(({ errorMessage }) => {
    console.log(`Ohgoodness Jeez ERROR ${errorMessage}`);
  });

function App() {
  const [eventName, setEventName] = React.useState('greeting');
  const sendMessage = () => {
    myWorker.send(eventName);
  };
  return (
    <>
      <h2>🛠 Background Workers</h2>
      <fieldset style={{ marginTop: 10 }}>
        <legend>Worker Status</legend>
        <div style={{ fontSize: 12, marginTop: 4, marginBottom: 4 }}>
          <label>Worker Status: </label>
          <span>{appState.workerRunning ? 'Running' : 'Not Running'}</span>
        </div>
        <button onClick={() => myWorker.start()}>Start Worker</button>
        <button>Stop Worker</button>
        <button>Terminate Worker</button>
      </fieldset>
      <fieldset style={{ marginTop: 10 }}>
        <legend>Send Event</legend>
        <div>
          <button onClick={sendMessage}>Send Message</button>
          <input
            style={{ minWidth: '250px', marginLeft: 10 }}
            value={eventName}
            onChange={e => setEventName(e.currentTarget.value)}
          />
        </div>
      </fieldset>
    </>
  );
}

export default App;
