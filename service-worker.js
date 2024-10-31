console.log('service-worker.js loaded');

let currentTab = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith("chrome://")) {
    console.error("Cannot capture a chrome:// URL.");
    return;
  }

  const existingContexts = await chrome.runtime.getContexts({});
  let recording = false;

  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
  );

  currentTab = tab;

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    // Create an offscreen document.
    await chrome.offscreen.createDocument({
      url: '/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API'
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['injectModal.js']
    });
  } else {
    recording = offscreenDocument.documentUrl.endsWith('#recording');
  }

  if (recording) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen'
    });
    // Remove the modal
    // chrome.scripting.executeScript({
    //   target: { tabId: currentTab.id },
    //   func: () => {
    //     if (typeof rightModal === 'undefined') {
    //       let rightModal = document.getElementById('ai_audio_right_modal');

    //       if (rightModal) {
    //         document.body.removeChild(rightModal);
    //       } else {
    //         console.log('Element with ID "ai_audio_right_modal" does not exist.');
    //       }
    //     } else {
    //       rightModal = document.getElementById('ai_audio_right_modal');
    //       if (rightModal) {
    //         document.body.removeChild(rightModal);
    //       } else {
    //         console.log('Element with ID "ai_audio_right_modal" does not exist.');
    //       }
    //     }
    //   }
    // });
    chrome.action.setIcon({ path: '/icons/not-recording.png' });
    return;
  }

  // Get a MediaStream for the active tab.
  let streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  });

  // Send the stream ID to the offscreen document to start recording.
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: streamId
  });

  chrome.action.setIcon({ path: '/icons/recording.png' });
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'transcription') {
    console.log('transcription:', message.data);
  }
  if (message.type === 'answers') {
    console.log('answers:', message.data);
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: (text) => {
        const sidebarElement = document.getElementById('ai_audio_new_element');
        if (sidebarElement) {
          const newItem = document.createElement('div');
          newItem.innerHTML = `<h3>${text}</h3><br><br>`;
          if (sidebarElement.children.length > 10) {
            sidebarElement.removeChild(sidebarElement.children[0]);
          }
          sidebarElement.appendChild(newItem);
        } else {
          console.log('Element with ID "ai_audio_new_element" does not exist.');
        }
      },
      args: [message.data]
    });
  }
  if (message.type === 'modal') {
    console.log('modal:', message);
    // chrome.scripting.executeScript({
    //   target: { tabId: currentTab.id },
    //   files: ['removeModal.js']
    // });
  }
});