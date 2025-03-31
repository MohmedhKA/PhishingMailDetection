// Gmail Email Extraction and Phishing Detection Script

// Server URL - update with your actual server address
const SERVER_URL = 'http://localhost:5000/predict';

// Track which emails we've already processed
const processedEmails = new Set();

// Main function to initialize the extension
function initializeExtension() {
  if (!window.location.hostname.includes('mail.google.com')) {
    return;
  }
  
  console.log('Phishing detector initialized on Gmail');
  
  // Watch for email changes
  setupMutationObserver();
  
  // Process any currently open email
  setTimeout(processOpenEmail, 1000);
}

// Setup a mutation observer to watch for changes in the Gmail interface
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check if we're viewing an email
        const emailContainer = document.querySelector('.a4W');
        if (emailContainer) {
          const emailSubject = document.querySelector('h2.hP')?.textContent;
          const emailId = emailSubject ? emailSubject : 'unknown';
          
          if (!processedEmails.has(emailId)) {
            processOpenEmail();
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Process the currently open email
function processOpenEmail(forceProcess = false) {
  // Find the email container
  const emailContainer = document.querySelector('.a4W');
  if (!emailContainer) {
    console.log('No open email found');
    return;
  }
  
  // Get a unique identifier for this email
  const emailSubject = document.querySelector('h2.hP')?.textContent;
  const emailId = emailSubject ? emailSubject : 'unknown';
  
  // Skip if we've already processed this email and not forcing
  if (processedEmails.has(emailId) && !forceProcess) {
    return;
  }
  
  try {
    // Extract email data
    const emailData = extractEmailData();
    
    if (!emailData) {
      console.log('Could not extract email data');
      return;
    }
    
    // Mark as processed
    processedEmails.add(emailId);
    
    // Show scanning indicator
    const scanningOverlay = showScanningOverlay();
    
    // Send to server for analysis
    fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      // Remove scanning overlay
      scanningOverlay.remove();
      
      // Add result banner
      addResultBanner(emailContainer, result.result);
      
      // Highlight suspicious elements if phishing
      if (result.result === 'Phishing') {
        highlightSuspiciousElements();
      }
    })
    .catch(error => {
      console.error('Error analyzing email:', error);
      scanningOverlay.remove();
      
      // Show error message
      const errorBanner = document.createElement('div');
      errorBanner.className = 'phishing-warning-banner';
      errorBanner.style.backgroundColor = '#FF8C00';
      errorBanner.textContent = 'Error checking email: Could not connect to analysis server';
      emailContainer.prepend(errorBanner);
    });
  } catch (err) {
    console.error('Error processing email:', err);
  }
}

// Extract email data from Gmail interface
function extractEmailData() {
  try {
    // Get sender information
    const senderElement = document.querySelector('.gD');
    const senderName = senderElement?.textContent || '';
    const senderEmail = senderElement?.getAttribute('email') || '';
    
    // Get subject
    const subjectElement = document.querySelector('h2.hP');
    const subject = subjectElement?.textContent || '';
    
    // Get email body
    const bodyElement = document.querySelector('.a3s.aiL');
    const body = bodyElement?.innerText || '';
    
    if (!senderEmail || !subject || !body) {
      console.log('Missing email information', { senderEmail, subject, bodyLength: body.length });
      return null;
    }
    
    return {
      sender: `${senderName} <${senderEmail}>`,
      subject: subject,
      body: body
    };
  } catch (err) {
    console.error('Error extracting email data:', err);
    return null;
  }
}

// Show a scanning overlay while waiting for results
function showScanningOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'scanning-overlay';
  overlay.innerHTML = `
    <div class="scanning-spinner"></div>
    <div>Analyzing email for phishing attempts...</div>
  `;
  
  document.body.appendChild(overlay);
  
  // Return the overlay element so it can be removed later
  return overlay;
}

// Add a banner showing the analysis result
function addResultBanner(emailContainer, result) {
  // Remove any existing banners
  const existingBanner = emailContainer.querySelector('.phishing-warning-banner, .safe-email-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Create banner
  const banner = document.createElement('div');
  
  if (result === 'Phishing') {
    banner.className = 'phishing-warning-banner';
    banner.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" stroke-width="2"/>
        <path d="M12 8V12" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="16" r="1" fill="white"/>
      </svg>
      <div>
        <strong>WARNING: Potential phishing detected!</strong>
        <div>This email contains characteristics commonly found in phishing attempts.</div>
      </div>
    `;
  } else {
    banner.className = 'phishing-warning-banner';
    banner.style.backgroundColor = '#3CB371';
    banner.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" stroke-width="2"/>
        <path d="M7 12L10 15L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <strong>Email appears safe</strong>
        <div>No phishing indicators were detected in this email.</div>
      </div>
    `;
  }
  
  // Add to email
  emailContainer.prepend(banner);
}

// Highlight suspicious elements like links
function highlightSuspiciousElements() {
  // Find all links in the email
  const emailBody = document.querySelector('.a3s.aiL');
  if (!emailBody) return;
  
  const links = emailBody.querySelectorAll('a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    const displayText = link.textContent;
    
    // Simple heuristic: highlight if display text doesn't match href
    if (href && displayText && !displayText.includes(href) && !href.includes(displayText)) {
      link.classList.add('suspicious-link');
    }
  });
}

// Initialize the extension
window.addEventListener('load', () => {
  setTimeout(initializeExtension, 1500); // Delay slightly to ensure Gmail is loaded
});

// Check periodically for Gmail SPA navigation
setInterval(() => {
  const emailContainer = document.querySelector('.a4W');
  if (emailContainer) {
    const emailSubject = document.querySelector('h2.hP')?.textContent;
    const emailId = emailSubject ? emailSubject : 'unknown';
    
    if (!processedEmails.has(emailId)) {
      processOpenEmail();
    }
  }
}, 2000);

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStatus") {
    const resultBanner = document.querySelector('.phishing-warning-banner');
    if (resultBanner) {
      const isPhishing = resultBanner.style.backgroundColor === 'rgb(220, 20, 60)';
      sendResponse({result: isPhishing ? 'Phishing' : 'Safe'});
    } else {
      sendResponse({result: 'No email analyzed yet'});
    }
  }
  return true;
});

// Add this to your existing message listener in content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeCurrentEmail") {
    const emailData = extractEmailData();
    
    if (!emailData) {
      sendResponse({result: 'No email found'});
      return true;
    }

    fetch('http://192.168.1.4:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })
    .then(response => response.json())
    .then(result => {
      // Add result banner to email
      const emailContainer = document.querySelector('.a4W');
      if (emailContainer) {
        addResultBanner(emailContainer, result.result);
      }
      
      sendResponse({result: result.result});
    })
    .catch(error => {
      console.error('Error:', error);
      sendResponse({result: 'Error analyzing email'});
    });

    return true; // Keep the message channel open for async response
  }
});