class Api {
  constructor() {
    this.baseUrl = "LARAVEL_API_URL";
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store the token in extension storage
        await chrome.storage.local.set({ token: data.token });
        return data;
      }
      throw new Error(data.message);
    } catch (error) {
      throw error;
    }
  }

  async sendVideosForAnalysis(videos) {
    const token = await this.getToken();
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videos }),
      });

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getToken() {
    const data = await chrome.storage.local.get("token");
    return data.token;
  }
}

const api = new Api();
