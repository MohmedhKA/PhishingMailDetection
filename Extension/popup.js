console.log("Gmail Phishing Detector content script loaded");

// Initialize Gmail.js in the content script context
let gmailInstance = null;

function initializeGmail() {
    console.log("Initializing Gmail.js in content script");
    try {
      gmailInstance = new Gmail();
      console.log("Gmail.js initialized successfully in content script:", gmailInstance);
      
      // Listen for messages from popup
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Message received in content script:", request);
        
        if (request.action === "extractEmailData") {
          console.log("Extracting email data from content script");
          const data = extractEmailData();
          console.log("Extracted data:", data);
          sendResponse(data);
        }
        // Return true to indicate you'll respond asynchronously
        return true;
      });
    } catch (e) {
      console.error("Failed to initialize Gmail.js in content script:", e);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    console.log("Gmail Phishing Detector Installed.");

    const scanButton = document.getElementById("scanEmail");
    if (scanButton) {
        scanButton.addEventListener("click", function () {
            document.getElementById("result").innerText = "Scanning email...";
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                // Send message to content script
                chrome.tabs.sendMessage(tabs[0].id, { action: "extractEmailData" }, (response) => {
                    console.log("Response from content script:", response);
                    
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError);
                        document.getElementById("result").innerText = "Error: " + chrome.runtime.lastError.message;
                        return;
                    }
                    
                    if (!response) {
                        console.error("Failed to extract email data.");
                        document.getElementById("result").innerText = "Failed to extract email data. Make sure you have an email open.";
                        return;
                    }
                    
                    sendEmailForAnalysis(response);
                });
            });
        });
    } else {
        console.error("scanEmail button not found in popup.html");
        const errorMsg = document.createElement("div");
        errorMsg.style.color = "red";
        errorMsg.innerText = "Error: Scan button not found. Check popup.html";
        document.body.appendChild(errorMsg);
    }
});

function sendEmailForAnalysis(emailData) {
    if (!emailData || !emailData.sender || !emailData.subject || !emailData.body) {
        console.error("Invalid email data:", emailData);
        document.getElementById("result").innerText = "Failed to extract email details.";
        return;
    }

    console.log("Sending email data:", JSON.stringify(emailData));
    document.getElementById("result").innerText = "Analyzing email...";

    fetch("https://192.168.1.4:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Response from server:", data);
        document.getElementById("result").innerText = `Result: ${data.result}`;
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("result").innerText = "Failed to get response: " + error.message;
    });
}

// This function will be injected and run in the Gmail page context
function extractEmailData() {
  console.log("Running extractEmailData in content script");
  
  if (!gmailInstance) {
    console.error("Gmail.js is not initialized in content script");
    return null;
  }

  try {
    const emailId = gmailInstance.get.email_id();
    console.log("Email ID:", emailId);
    
    if (!emailId) {
      console.error("No email ID found. Make sure you have an email open.");
      return null;
    }

    const emailData = gmailInstance.get.email_data(emailId);
    
    if (!emailData || !emailData.threads || !emailData.threads[emailId]) {
      console.error("Failed to fetch email data for ID:", emailId);
      return null;
    }

    const thread = emailData.threads[emailId];
    const extractedData = {
      sender: thread.from?.address || "Unknown",
      subject: thread.subject || "No Subject",
      body: thread.content_plain || "No Body"
    };

    console.log("Successfully extracted email data:", extractedData);
    return extractedData;
  } catch (e) {
    console.error("Error extracting email data:", e);
    return null;
  }
}

// Wait for Gmail to fully load before initializing
window.addEventListener('load', function() {
  console.log("Window loaded in content script");
  setTimeout(initializeGmail, 1000); // Give Gmail a moment to fully initialize
});

// Or try with mutation observer to detect when Gmail is ready
const observer = new MutationObserver((mutations, obs) => {
  const gmailView = document.getElementById('views');
  if (gmailView) {
    console.log("Gmail view detected, initializing Gmail.js");
    initializeGmail();
    obs.disconnect();
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});

function analyzeEmailFromPopup() {
    const gmail = Gmail();
    
    const emailData = gmail.get.email_data();
    
    if (!emailData || !emailData.threads || emailData.threads.length === 0) {
        console.error("No email data found.");
        return { sender: "", subject: "", body: "" };
    }
    
    const thread = emailData.threads[0];
    return {
        sender: thread.from.address,
        subject: thread.subject,
        body: thread.body
    };
}