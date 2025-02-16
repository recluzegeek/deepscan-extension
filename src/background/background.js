import { CONFIG } from '../config/config.js';

let authTabId = null;

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "error") {
    console.error("Error:", request.error);
    logError(request.error);
  }
  if (request.type === "log") {
    console.log("Log:", request.data);
  }
  return true;
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Extension installed");
    chrome.storage.local.set({
      installDate: new Date().toISOString(),
    });
  }
});

// Error logging function
function logError(error) {
  console.error("Server:", CONFIG.API_BASE_URL);
  console.error("Error details:", {
    message: error.message,
    context: error.context,
    timestamp: new Date().toISOString(),
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === authTabId && changeInfo.url && changeInfo.url.includes("code=")) {
    const urlParams = new URLSearchParams(new URL(changeInfo.url).search);
    const code = urlParams.get("code");
    if (code) {
      handleAuthCode(code, tabId);
    }
  }
});

async function initializeAuth() {
  const authUrl =
    `${CONFIG.API_BASE_URL}/oauth/authorize?` +
    new URLSearchParams({
      client_id: "YOUR_CLIENT_ID",
      redirect_uri: `${CONFIG.API_BASE_URL}/oauth/callback`,
      response_type: "code",
      scope: "",
    }).toString();

  const tab = await chrome.tabs.create({ url: authUrl });
  authTabId = tab.id;
}

async function handleAuthCode(code, tabId) {
  try {
    // Exchange code for token
    const response = await fetch(`${CONFIG.API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: "YOUR_CLIENT_ID",
        client_secret: "YOUR_CLIENT_SECRET",
        redirect_uri: `${CONFIG.API_BASE_URL}/oauth/callback`,
        code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      await chrome.storage.local.set({
        token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Close the auth tab and notify popup
      chrome.tabs.remove(tabId);
      chrome.runtime.sendMessage({ action: "authSuccess" });
    }
  } catch (error) {
    logError({
      message: error.message,
      stack: error.stack,
      context: "auth",
    });
    chrome.runtime.sendMessage({
      action: "authError",
      error: error.message,
    });
  }
}
