import { createApp, ref, onMounted, h } from "../lib/vue.runtime.esm-browser.js";
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

    const scanForVideos = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Get active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
          throw new Error("No active tab found");
        }

        // Inject content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["src/content/content.js"]
          });
        } catch (err) {
          if (err.message.includes('Cannot access chrome://')) {
            error.value = "Cannot scan chrome:// pages";
            return;
          }
          throw err;
        }

        // Get videos
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "getVideos" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Message error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });

        if (response?.videos) {
          videos.value = response.videos;
        } else {
          videos.value = [];
        }
      } catch (err) {
        console.error("Error scanning videos:", err);
        error.value = "Failed to scan videos";
        videos.value = [];
      } finally {
        loading.value = false;
      }
    };

    const checkAuthStatus = async () => {
      try {
        const token = await chrome.storage.local.get("token");
        if (token.token) {
          const isValid = await api.verifyToken();
          isLoggedIn.value = isValid;
          if (isValid) {
            await scanForVideos();
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
      if (isLoggedIn.value) {
        await scanForVideos();
      }
    });

    const handleLoginSuccess = async () => {
      isLoggedIn.value = true;
      await scanForVideos();
    };

    const handleLogout = async () => {
      try {
        await api.logout();
        isLoggedIn.value = false;
        videos.value = [];
      } catch (err) {
        console.error("Logout error:", err);
        error.value = "Logout failed";
      }
    };

    return () =>
      h("div", { id: "app" }, [
        loading.value
          ? h("div", { class: "loading-container" }, [
              h("div", { class: "loading-spinner" }),
              h("p", null, "Scanning for videos..."),
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
