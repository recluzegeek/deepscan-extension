import { CONFIG } from '../config/config.js';

export async function login(email, password) {
  try {
    const response = await fetch(`${CONFIG.FULL_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store both token and user data
    await chrome.storage.local.set({
      token: data.token,
      lastLogin: new Date().getTime(),
    });

    return data;
  } catch (error) {
    console.log("Login error:", error);
    throw error;
  }
}

export async function verifyToken() {
  try {
    const data = await chrome.storage.local.get(["token", "lastLogin"]);

    // If no token exists, return false
    if (!data.token) {
      return false;
    }

    // Check if token was verified in the last five minutes
    if (data.lastLogin && new Date().getTime() - data.lastLogin < 300000) {
      return true;
    }

    // Verify token by fetching user data
    const response = await fetch(`${CONFIG.FULL_API_URL}/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${data.token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const userData = await response.json();
      // Store user data along with last login time
      await chrome.storage.local.set({
        user: userData,
        lastLogin: new Date().getTime(),
      });
      return true;
    }

    // If verification fails, clear stored data
    await chrome.storage.local.remove(["token", "user", "lastLogin"]);
    return false;
  } catch (error) {
    chrome.runtime.sendMessage({ type: "log", data: "Token verification error:" + error });
    return false;
  }
}

export async function logout() {
  try {
    const token = await chrome.storage.local.get("token");
    const response = await fetch(`${CONFIG.FULL_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    // Clear all stored data
    await chrome.storage.local.remove(["token", "user", "lastLogin"]);
  } catch (error) {
    console.log("Logout error:", error);
    throw error;
  }
}

export async function sendVideosForAnalysis(videos) {
  if (videos.length > 4) {
    throw new Error("Maximum 4 videos can be analyzed at once");
  }

  try {
    const token = await chrome.storage.local.get("token");
    const response = await fetch(`${CONFIG.FULL_API_URL}/videos/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({ videos }),
    });

    if (!response.ok) {
      throw new Error("Failed to send videos for analysis");
    }

    return await response.json();
  } catch (error) {
    console.log("Analysis error:", error);
    throw error;
  }
}

export { CONFIG };
