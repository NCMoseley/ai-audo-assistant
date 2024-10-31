console.log('injectModal.js loaded');

function createModal() {
	// Create modal container
	const modal = document.createElement('div');
	modal.id = 'ai_audio_right_modal';
	modal.style.position = 'fixed';
	modal.style.top = '0';
	modal.style.right = '0';
	modal.style.width = '30%';
	modal.style.height = '100%';
	modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	modal.style.display = 'flex';
	modal.style.justifyContent = 'center';
	modal.style.alignItems = 'start';
	modal.style.zIndex = '1000';
	modal.style.overflowY = 'scroll';

	// Create modal content
	const modalContent = document.createElement('div');
	modalContent.style.backgroundColor = 'white';
	modalContent.style.padding = '20px';
	modalContent.style.width = '80%';
	modalContent.style.minWidth = '350px';
	modalContent.style.marginTop = '100px';
	// modalContent.style.marginRight = '40px';
	modalContent.style.borderRadius = '5px';
	modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
	modalContent.innerHTML = `
        <h2>Ai Assistant</h2>
		<div style="margin-left: auto; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: 80%;">
			<p>Some context from the user questions: </p>
			<div id="ai_audio_new_element"></div>
			<button id="closeModal">Close</button>
		</div>
    `;

	// Append content to modal
	modal.appendChild(modalContent);

	// Append modal to body
	document.body.appendChild(modal);

	// Add event listener to close the modal
	document.getElementById('closeModal').addEventListener('click', () => {
		document.body.removeChild(modal);
	});
}

// Call the function to create and show the modal
createModal();