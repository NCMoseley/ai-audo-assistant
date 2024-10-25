// const axios = require("axios");
const FormData = require("form-data");
// const fs = require("fs");

export async function transcribeAudio(blob) {
  let apiKey;
  chrome.storage.local.get(['apiKey'], function (result) {
    console.log('API Key currently is: ' + result.apiKey);
    apiKey = result.apiKey;
  });

  const audioFilePath = "path/to/your/file.mp3"; // Replace with your audio file path

  // Prepare the audio file as form data
  const formData = new FormData();
  formData.append('audio recording', blob, 'audio.webm');
  // formData.append("file", fs.createReadStream(audioFilePath));
  formData.append("model", "whisper-1");

  try {
    // Make the request to OpenAI's audio transcription endpoint
    const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${apiKey}`
      },
    });

    // Output the transcription
    console.log("Transcription:", response.data.text);
  } catch (error) {
    console.error("Error transcribing audio:", error.response ? error.response.data : error.message);
  }
}
