import { createApp, ref, onMounted, h, Fragment } from "../lib/vue.runtime.esm-browser.js";
import * as api from "../utils/api.js";
import LoginView from "../components/LoginView.js";
import VideoView from "../components/VideoView.js";

const app = createApp({
  components: {
    LoginView,
    VideoView,
  },
  setup() {
    const isLoggedIn = ref(false);
    const loading = ref(true);
    const videos = ref([]);
    const error = ref(null);

    const loadVideos = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // First try to get videos from storage for this tab
        const storedData = await chrome.storage.local.get(`videos_${tab.id}`);
        if (storedData[`videos_${tab.id}`]) {
          videos.value = storedData[`videos_${tab.id}`];
          return;
        }

        // If no stored videos, inject content script and get fresh data
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/content.js"],
        });

        chrome.tabs.sendMessage(tab.id, { action: "getVideos" }, async (response) => {
          if (response?.videos) {
            videos.value = response.videos;
            // Store videos for this tab
            await chrome.storage.local.set({ [`videos_${tab.id}`]: response.videos });
          }
        });
      } catch (err) {
        console.log("Error loading videos:", err);
        error.value = "Failed to load videos";
      }
    };

    const checkAuthStatus = async () => {
      try {
        const token = await chrome.storage.local.get("token");
        if (token.token) {
          const isValid = await api.verifyToken();
          isLoggedIn.value = isValid;
          if (isValid) {
            await loadVideos();
          }
        }
      } catch (err) {
        console.log("Auth check failed:", err);
        isLoggedIn.value = false;
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await checkAuthStatus();
    });

    const handleLoginSuccess = async () => {
      isLoggedIn.value = true;
      await loadVideos();
    };

    const handleLogout = async () => {
      try {
        await api.logout();
        isLoggedIn.value = false;
        videos.value = [];
        // Clear stored videos and token
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.storage.local.remove([`videos_${tab.id}`, "token"]);
      } catch (err) {
        console.log("Logout error:", err);
        error.value = "Logout failed";
      }
    };

    return () =>
      h("div", { id: "app" }, [
        loading.value
          ? h("div", { class: "loading-container" }, [
              h("div", { class: "loading-spinner" }),
              h("p", null, "Loading..."),
            ])
          : isLoggedIn.value
          ? h(VideoView, {
              videos: videos.value,
              onLogout: handleLogout,
              error: error.value,
            })
          : h(LoginView, {
              onLoginSuccess: handleLoginSuccess,
            }),
      ]);
  },
});

app.mount("#app");
