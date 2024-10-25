import { useEffect } from "react";
import viteLogo from "/vite.svg";
import { startRecording, stopRecording } from "./actions/offscreen";
import "./App.css";

function App() {
  // const [count, setCount] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "greeting", message: "Hello from Vite!" },
      (response) => {
        console.log("Response from background:", response);
      }
    );
  }, []);

  const startRecording = async () => {
    await startRecording();
  };

  const stopRecording = async () => {
    await stopRecording();
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <div className="card">
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
      </div>
    </>
  );
}

export default App;
