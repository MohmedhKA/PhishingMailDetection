document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('checkButton');
  const senderInput = document.getElementById('sender');
  const subjectInput = document.getElementById('subject');
  const bodyInput = document.getElementById('body');
  const resultDiv = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  
  // Server URL - update this with your actual server address
  const SERVER_URL = 'http://192.168.1.4:5000/predict';
  
  checkButton.addEventListener('click', function() {
    // Validate inputs
    if (!senderInput.value.trim() || !subjectInput.value.trim() || !bodyInput.value.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    // Disable button and show loading state
    checkButton.disabled = true;
    checkButton.textContent = 'Analyzing...';
    
    // Prepare data to send
    const data = {
      sender: senderInput.value.trim(),
      subject: subjectInput.value.trim(),
      body: bodyInput.value.trim()
    };
    
    // Send request to server
    fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Display result
      resultDiv.classList.remove('hidden');
      resultText.textContent = data.result;
      
      // Apply appropriate class based on result
      resultText.className = '';
      if (data.result === 'Safe') {
        resultText.classList.add('safe');
      } else {
        resultText.classList.add('phishing');
      }
      
      // Add animation
      resultDiv.classList.add('animate');
      
      // Re-enable button
      checkButton.disabled = false;
      checkButton.textContent = 'Check Email';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error: ' + error.message);
      
      // Re-enable button
      checkButton.disabled = false;
      checkButton.textContent = 'Check Email';
    });
  });

  // Query the active tab to get the current email status
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getStatus"}, function(response) {
      if (response && response.result) {
        showResult(response.result);
      }
    });
  });

  function showResult(result) {
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    
    resultDiv.classList.remove('hidden');
    resultText.textContent = result;
    resultText.className = result === 'Safe' ? 'safe' : 'phishing';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('checkCurrentEmail');
  const resultDiv = document.getElementById('result');
  const resultText = document.getElementById('resultText');

  checkButton.addEventListener('click', function() {
    // Disable button and show loading state
    checkButton.disabled = true;
    checkButton.textContent = 'Analyzing...';

    // Send message to content script to analyze current email
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "analyzeCurrentEmail"}, function(response) {
        if (response && response.result) {
          // Show result
          resultDiv.classList.remove('hidden');
          resultText.textContent = response.result;
          resultText.className = response.result === 'Safe' ? 'safe' : 'phishing';
        } else {
          resultText.textContent = 'No email found or error occurred';
          resultText.className = '';
        }
        
        // Re-enable button
        checkButton.disabled = false;
        checkButton.textContent = 'Check this mail';
      });
    });
  });
});
