// Ensure Gmail is loaded
// Initialize Gmail.js in the content script
let gmail;
window.gmail = null;

function initializeGmail() {
  try {
    gmail = new Gmail();
    window.gmail = gmail;
    console.log("Gmail.js initialized in content script:", gmail);
  } catch (e) {
    console.error("Failed to initialize Gmail.js in content script:", e);
  }
}

// Wait for Gmail to load completely
const loadCheckInterval = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(loadCheckInterval);
    initializeGmail();
  }
}, 100);

window.onload = function () {
  if (typeof Gmail === "undefined") {
      console.error("Gmail.js not loaded");
      return;
  }

  var gmail = new Gmail();
  console.log("Gmail API loaded");

  // Detect when an email is opened
  gmail.observe.on("view_email", (email) => {
      console.log("Email opened: ", email);
      analyzeEmail(email);
  });

  function analyzeEmail(email) {
      let sender = email.from.address;
      let subject = email.subject;
      let body = email.content_html || email.content_plaintext;

      let emailData = {
          sender: sender,
          subject: subject,
          body: body
      };

      fetch("https://192.168.1.4:5000/predict", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(emailData)
      })
      .then(response => response.json())
      .then(data => {
          alert("Prediction: " + data.result);
      })
      .catch(error => {
          console.error("Error:", error);
      });
  }
};
// Gmail API Injection Script
var s = document.createElement('script');
s.src = chrome.runtime.getURL('gmail.js');
(document.head || document.documentElement).appendChild(s);
