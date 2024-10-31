console.log('offscreen.js loaded');

async function transcribeAudio(chunks) {
  const VITE_OPENAI_API_KEY = ""
  // Prepare the audio file as form data
  const blob = new Blob(chunks);
  const file = new File([blob], "input.webm", { type: "audio/webm" });

  const formData = new FormData();
  formData.append("model", "whisper-1");
  formData.append("file", file);
  formData.append("response_format", "json");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VITE_OPENAI_API_KEY}`,
      },
      body: formData
    });

    const json = await response.json();

    // const json = {
    //   text: 'This is a test transcription'
    // };

    // Output the transcription
    chrome.runtime.sendMessage({
      type: 'transcription',
      target: 'service-worker',
      data: json
    });

    console.log("Transcription:", json);
    return json;
  } catch (error) {
    console.error("Error transcribing audio:", error.response ? error.response.data : error.message);
  }
}

let counter = 0;

async function compileAnswers(text) {
  const PERPLEXITY_API_KEY = '';

  const body = JSON.stringify({
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [
      { role: 'system', content: 'You are a helpful assistant. You are given a transcript of a conversation and you need to assist the people in the conversation by adding contexts based on the transcript.The goal is to have some fact checking added to the conversation. Only listen to clear questions or statements, and provide concise answers. 1. You dont have to answer every question, only the ones that are clear and concise. DO NOT RESPOND TO INCOMPLETE STATEMENTS OR QUESTIONS. 2. The important questions are the ones that are very black and white, and not open to interpretation. 3. You dont need to answer questions that are open to interpretation, or questions that are not clear. 4. You dont need to answer questions that are redundant or not related to the conversation. You should only respond with short answers, that are concise and to the point. 5. Dont respond with large paragraphs. Start each answer with "Question: ", then the question, then "Answer: " and end it with a period. 6. Dont respond with "Sure, here is the answer: " or anything like that. 7. Some of the text will not be related to the conversation, and you should ignore it. 8. Dont respond with any personality or anything like that. Just answer the questions. 9. Make the answers as short as possible, but still provide all the necessary information. 10. If the question is not clear, or if the answer is not very black and white, just say "I am not sure" or something like that. 11. If you havent received the whole question, just wait for it to arrive before your respond. Dont respond unless you have all the context to a question. 12. Dont respond to every question or statement, only to the ones that have clear, black and white answers. 13. Respond with 2 sentences max. Dont respond to personal questions like how are you doing today, or statements people make about themselves or how they feel. It is very likely that you wont respond to most of the questions or context that are passed to you. ' },
      { role: 'user', content: text }
    ],
    stream: true
  });

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalText = '';

    console.log('Stream started');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6);
          if (jsonData === '[DONE]') {
            console.log('Stream finished');
          } else {
            try {
              const parsedData = JSON.parse(jsonData);
              if (parsedData.choices && parsedData.choices[0].delta.content) {
                finalText += parsedData.choices[0].delta.content;
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    }

    // const finalText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    counter++;

    chrome.runtime.sendMessage({
      type: 'answers',
      target: 'service-worker',
      data: counter + ': ' + finalText
    });

    console.log('\nStream ended');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

let recorder;
let data = [];
let running = false;

async function startRecording(streamId) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.');
  }

  running = true;

  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
  });

  // Continue to play the captured audio to the user.
  const output = new AudioContext();
  const source = output.createMediaStreamSource(media);
  source.connect(output.destination);

  const start = () => {
    // Start recording.
    recorder = new MediaRecorder(media, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.onstop = async () => {
      const res = await transcribeAudio(data);
      if (res.text) {
        compileAnswers(res.text);
      }
      // Clear state ready for next recording
      recorder = undefined;
      data = [];
    };
    recorder.start();
  }

  setInterval(() => {
    if (recorder?.state === 'recording') {
      recorder.stop();
    }
    if (running) {
      start();
    }
  }, 9000);

  window.location.hash = 'recording';
}

async function stopRecording() {
  running = false;
  if (recorder?.state === 'recording') {
    recorder.stop();
  }

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  if (recorder?.stream) {
    recorder.stream.getTracks().forEach((t) => t.stop());
  }

  // Update current state in URL
  window.location.hash = '';

  chrome.runtime.sendMessage({
    type: 'modal',
    target: 'service-worker',
    data: ''
  });

  // Note: In a real extension, you would want to write the recording to a more
  // permanent location (e.g IndexedDB) and then close the offscreen document,
  // to avoid keeping a document around unnecessarily. Here we avoid that to
  // make sure the browser keeps the Object URL we create (see above) and to
  // keep the sample fairly simple to follow.
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('offscreen.js:', message);
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        startRecording(message.data);
        break;
      case 'stop-recording':
        stopRecording();
        break;
      default:
        throw new Error('Unrecognized message:', message.type);
    }
  }
});