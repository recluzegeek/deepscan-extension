const BASE_URL = "http://localhost:8000";
const API_BASE_URL = `${BASE_URL}/api`;

export async function login(email, password) {
  console.log("Connecting to server:", BASE_URL);
  try {
    // First, get the CSRF cookie
    console.log("Fetching CSRF cookie...");
    await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
    });

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    console.log("Login response status:", response.status);
    let data;
    try {
      data = await response.json();
      console.log("Login response:", data);
    } catch (err) {
      console.error("Failed to parse response:", err);
      throw new Error("Server returned invalid response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || "Login failed");
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Unable to connect to server. Please check your internet connection.");
    }
    throw error;
  }
}

export async function logout() {
  console.log("Connecting to server:", BASE_URL);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    console.log("Logout response status:", response.status);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Logout failed");
    }
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function analyzeVideo(url) {
  console.log("Connecting to server:", BASE_URL);
  console.log("Analyzing video:", url);
  try {
    const response = await fetch(`${API_BASE_URL}/videos/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ url }),
    });

    console.log("Analysis response status:", response.status);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Analysis failed");
    }

    const result = await response.json();
    console.log("Analysis result:", result);
    return result;
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
}

class Api {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  async sendVideosForAnalysis(videos) {
    console.log("Connecting to server:", this.baseUrl);
    console.log("Sending videos for analysis:", videos);
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ videos }),
      });

      console.log("Bulk analysis response status:", response.status);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send videos for analysis");
      }

      const result = await response.json();
      console.log("Bulk analysis result:", result);
      return result;
    } catch (error) {
      console.error("Bulk analysis error:", error);
      throw error;
    }
  }
}

const api = new Api();
export { api, BASE_URL };
