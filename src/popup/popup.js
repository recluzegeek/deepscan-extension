import { createApp, ref, onMounted, h } from "../lib/vue.runtime.esm-browser.js";
import * as api from "../utils/api.js";
import { BASE_URL } from "../utils/api.js";
import LoginView from "../components/LoginView.js";
import VideoView from "../components/VideoView.js";

const app = createApp({
  components: {
    LoginView,
    VideoView,
  },
  setup() {
    const isLoggedIn = ref(false);
    const email = ref("");
    const password = ref("");
    const videos = ref([]);
    const error = ref(null);
    const analyzing = ref(false);
    const loading = ref(false);
    const showPassword = ref(false);

    onMounted(async () => {
      console.log("App mounted, checking auth status...");
      try {
        // Check if there's a valid session cookie
        const response = await fetch(`${BASE_URL}/api/auth/check`, {
          credentials: "include",
        });
        console.log("Auth check response:", response.status, response.statusText);
        isLoggedIn.value = response.ok;
        console.log("Auth status:", isLoggedIn.value ? "Logged in" : "Not logged in");

        if (isLoggedIn.value) {
          await loadVideos();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        isLoggedIn.value = false;
      }
    });

    const handleLoginSuccess = () => {
      console.log("Login success handler called");
      isLoggedIn.value = true;
      loadVideos(); // Load videos after successful login
    };

    const handleLogout = async () => {
      console.log("Logout handler called");
      try {
        await api.logout();
        console.log("Logout successful");
        isLoggedIn.value = false;
        videos.value = [];
      } catch (err) {
        console.error("Logout failed:", err);
      }
    };

    const loadVideos = async () => {
      console.log("Loading videos...");
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("Current tab:", tab);
        chrome.tabs.sendMessage(tab.id, { action: "getVideos" }, (response) => {
          console.log("Content script response:", response);
          if (response && response.videos) {
            videos.value = response.videos.map((video) => ({
              ...video,
              selected: false,
            }));
            console.log("Videos loaded:", videos.value);
          } else {
            console.warn("No videos found in response:", response);
          }
        });
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    };

    const sendSelectedVideos = async () => {
      const selectedVideos = videos.value.filter((video) => video.selected);
      console.log("Sending selected videos:", selectedVideos);
      try {
        analyzing.value = true;
        error.value = null;
        const result = await api.sendVideosForAnalysis(selectedVideos);
        console.log("Analysis result:", result);
        analyzing.value = false;
        videos.value = videos.value.map((video) => ({
          ...video,
          selected: false,
        }));
        alert("Videos sent for deepfake analysis. Check the web platform for results.");
      } catch (err) {
        console.error("Analysis failed:", err);
        analyzing.value = false;
        error.value = "Failed to send videos for analysis. Please try again.";
      }
    };

    const hasSelectedVideos = () => {
      return videos.value.some((video) => video.selected);
    };

    return () =>
      h("div", { id: "app" }, [
        h("div", { class: "header" }, [
          h("img", {
            src: "../../assets/icons/icon16.png",
            alt: "DeepScan Logo",
            style: "width: 16px; height: 16px; margin-right: 8px;",
          }),
          h("h1", {}, "DeepScan"),
        ]),

        isLoggedIn.value
          ? h(VideoView, {
              onLogout: handleLogout,
              videos: videos.value,
              analyzing: analyzing.value,
              error: error.value,
              onSendVideos: sendSelectedVideos,
              hasSelectedVideos: hasSelectedVideos(),
            })
          : h(LoginView, {
              onLoginSuccess: handleLoginSuccess,
            }),
      ]);
  },
});

app.mount("#app");
